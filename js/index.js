window.APIURL = "http://127.0.0.1:3000"

angular.module("Creddon", [
  "ui.router"
  // "ngImgCrop"
])

.config(["$stateProvider", "$urlRouterProvider", "$httpProvider", function($stateProvider, $urlRouterProvider, $httpProvider){
  $urlRouterProvider.otherwise("/")

  $stateProvider
    .state("home", {
      url: "/",
      templateUrl: "templates/home.html"
    })
    .state("cause", {
      url: "/cause/:causeId/:sponsorId",
      templateUrl: "templates/cause.html"
    })
    .state("thank", {
      url: "/thank/:causeId/:sponsorId/:username",
      templateUrl: "templates/thank.html"
    })
}])

.run(["$rootScope", "$sce", function($rootScope, $sce){
  $rootScope.renderHTML = $sce.trustAsHtml
  $rootScope.grandTotal = 183735
  $rootScope.$on("$stateChangeSuccess", function(){window.scrollTo(0,0)})
}])

.controller("homeCtrl", ["$scope", "$http", "$httpf", "$state", function($scope, $http, $httpf, $state){
  $scope.registerEmail = function(){
    $http.post(APIURL+"/emails/", $scope.register).success(function(data){
      $scope.registeredEmail = true
    }).error(function(a,b,c,d){log(a,b,c,d); $scope.registeredEmail = true})
  }
  $scope.goCause = function(cause){
    console.log(cause.sponsorUsernames)
    var sponsorUsernames = cause.sponsorUsernames,
        sponsors = $scope.sponsors.filter(function(sp){return sponsorUsernames.indexOf(sp.username)>-1})

    var total = 0, sponsorTotals = {}
    for (var i=0;i<sponsors.length;i++){
      var sponsor = sponsors[i] // sponsor
      left = sponsor.remaining/sponsor.currentBeneficiaryUsernames.length // sponsor left
      sponsorTotals[sponsor._id] = left // register how much each sponsor has left
      total += left // increment total left for sponsors
    }
    var random = Math.random()*(total*2), //*2 because we add base weights worth 50% in total
        offset = total/sponsors.length, //calculate base weight to add to each sponsor
        comparison = 0, //initiate
        sponsorIndex = 0, //initiate
        sponsor = {}
    for (var k in sponsorTotals){
      comparison += (sponsorTotals[k]+offset) //add every sponsor's budget weight & base weight to the previous weights
      if (random < comparison) { sponsor = sponsors[sponsorIndex]; break } //stop after first success
      sponsorIndex++ //increment arrayIndex
    }

    $state.go("cause", {causeId: cause._id, sponsorId: sponsor._id})
  }

  $http.get(APIURL+"/causes/").success(function(data){
    console.log(data)
    $scope.causes = data
  }).error(log)
  $http.get("/sponsors/").success(function(data){
    $scope.sponsors = data
  }).error(log)
  $httpf.get("/sponsorLinks/").success(function(data){
    $scope.sponsorLinks = data
  }).error(log)
  $httpf.get("/sponsorImages/").success(function(data){
    $scope.sponsorImages = data
  }).error(log)
  // $scope.tw = false
  // $scope.fb = false
  // $scope.ig = false
  // $scope.selectCause = function(cause) {
  //   $scope.selectedCause = cause
  //   angular.element("#file-reader").trigger("click")
  // }
  // $scope.share = function(){
  //   $http({
  //     type: "POST",
  //     url: "https://creddon.com/crop",
  //     data: {img: $scope.image, logo: $scope.selectedCause.logo, tw: $scope.tw, fb: $scope.fb, ig: $scope.ig}
  //   })
  // }
  // angular.element(document.querySelector("#file-reader")).on("change", function(e){
  //   var file = e.currentTarget.files[0],
  //       reader = new FileReader()
  //   reader.onload = function(e){
  //     $scope.image = e.target.result
  //     $scope.$apply()
  //   }
  //   reader.readAsDataURL(file)
  // })

}])





.controller("causeCtrl", ["$scope", "$http", "$httpf", "$state", "$stateParams", function($scope, $http, $httpf, $state, $stateParams){
  $scope.tweet = function(){
    $scope.loading = true
    convertImgToBase64URL(document.querySelector(".tweeted-img").getAttribute("src"), function(base64Img){
      $http.post(APIURL+"/tweets/", {status: ($scope.caption||"")+$scope.captionEnding, media_data: base64Img, causeId: $scope.cause._id, sponsorId: $scope.sponsor._id}).success(function(data){
        if (data.redirect) window.location.href = APIURL+data.redirect+"?redirect="+window.location.href.replace("#", "|-|")
        else if (data.errors) $scope.errorMessage = data.errors[0].message
        else $state.go("thank", {causeId: $stateParams.causeId, sponsorId: $stateParams.sponsorId, username: data.screen_name})
      }).error(log)
    })
  }

  $http.get(APIURL+"/causes/"+$stateParams.causeId).success(function(data){
    $scope.cause = data
    $http.get(APIURL+"/sponsors/"+$stateParams.sponsorId).success(function(data){
      $scope.sponsor = data
        $httpf.get("/captionEndings/"+$scope.cause.username+"-"+$scope.sponsor.username).success(function(data){
          $scope.captionEnding = data
        }).error(log)
    }).error(log)
  }).error(log)
}])





.controller("thankCtrl", ["$scope", "$http", "$stateParams", function($scope, $http, $stateParams){
  $scope.vote = {}
  $scope.voted = false

  $scope.username = $stateParams.username

  $scope.registerEmail = function(){
    console.log($scope.register)
    $http.post(APIURL+"/emails/", $scope.register).success(function(data){
      $scope.registeredEmail = true
    }).error(function(a,b,c,d){log(a,b,c,d); $scope.registeredEmail = true})
  }
  $scope.voteNow = function(){
    $http.post(APIURL+"/votes/", $scope.vote).success(function(data){
      $scope.voted = true
    }).error(function(a,b,c,d){log(a,b,c,d); $scope.voted = true})
  }

  $http.get(APIURL+"/causes/"+$stateParams.causeId).success(function(data){
    $scope.cause = data
  }).error(log)
  $http.get(APIURL+"/sponsors/"+$stateParams.sponsorId).success(function(data){
    $scope.sponsor = data
  }).error(log)
}])


















.directive("loader", function(){
  return {
    templateUrl: "templates/loader.html"
  }
})




.service("$httpf", [function(){
  this.api = {
    "captionEndings": {
      "effect-bebo":" @Bebo_Official for @effectint #NepalQuakeRelief via creddon.com",
      "effect-anonymous_elyse":" Visit effect.org/donate for #NepalQuakeRelief —creddon.com",
      "effect-lab360":" lab360.com for @effectint in #Nepal via creddon.com",
      "effect-trackduck":" @TrackDuck for #NepalQuakeRelief by @effectint via creddon.com",
      "girls_who_code-bebo":" @Bebo_Official for @GirlsWhoCode #gender #tech via creddon.com",
      "girls_who_code-lab360":" lab360.com for @GirlsWhoCode #diversity —creddon.com",
      "girls_who_code-startuphouse":" @StartupHouse for @GirlsWhoCode #gender #tech via creddon.com",
      "girls_who_code-trackduck":" @TrackDuck for @GirlsWhoCode #tech #diversity via creddon.com",
      "kiva-bebo":" @Bebo_Official for @Kiva #crowdfunding #impact via creddon.com",
      "kiva-lab360":" lab360.com for @Kiva #microfinance via creddon.com",
      "kiva-trackduck":" @TrackDuck for @Kiva #crowdfunding #socialgood via creddon.com",
      "watsi-bebo":" @Bebo_Official for #lifechanging @watsi #health via creddon.com",
      "watsi-lab360":" lab360.com for @watsi #healthcare via creddon.com",
      "watsi-startuphouse":" @StartupHouse for @watsi #healthcare via creddon.com #socialgood",
      "watsi-trackduck":" @TrackDuck for @watsi #lifechanging #healthcare via creddon.com"
    },
    "sponsorImages": [
      "lab360-logo.png",
      "startuphouse-logo.png",
      "anonymous_elyse-logo.png",
      "bebo-logo.png",
      "trackduck-logo.jpg",
      "careerdean-logo.png",
      "rhsfinancial-logo.png"
    ],
    "sponsorLinks": [
      "http://lab360.com/",
      "http://startuphouse.com/",
      "",
      "http://bebo.com/",
      "http://trackduck.com/",
      "http://careerdean.com/",
      "http://rhsfinancial.com/"
    ]
  }


  /* Pathval for fake api. I modified it for browser. Original: chaijs/pathval */var pathval=function(){function e(e,n){var t=r(n);return i(t,e)}function n(e,n,i){var p=r(n);t(p,i,e)}function r(e){for(var n=(e||"").replace(/\[/g,".["),r=n.match(/(\\\.|[^.]+?)+/g),i=/\[(\d+)\]$/,t=[],p=null,a=0,f=r.length;f>a;a++)p=i.exec(r[a]),t.push(p?{i:parseFloat(p[1])}:{p:r[a]});return t}function i(e,n){for(var r,i=n,t=0,a=e.length;a>t;t++){var f=e[t];i?(p(f.p)?i=i[f.p]:p(f.i)&&(i=i[f.i]),t==a-1&&(r=i)):r=void 0}return r}function t(e,n,r){for(var i,t=r,a=0,f=e.length;f>a;a++)if(i=e[a],p(t)&&a==f-1){var u=p(i.p)?i.p:i.i;t[u]=n}else if(p(t))if(p(i.p)&&t[i.p])t=t[i.p];else if(p(i.i)&&t[i.i])t=t[i.i];else{var o=e[a+1],u=p(i.p)?i.p:i.i,l=p(o.p)?{}:[];t[u]=l,t=t[u]}else a==f-1?t=n:p(i.p)?t={}:p(i.i)&&(t=[])}function p(e){return!(!e&&"undefined"==typeof e)}return{parse:r,set:n,get:e}}();
  function filterByQuery(set, properties) {
    return set.filter(function (entry) {
      return Object.keys(properties).every(function (key) {
        return similar(entry[key], properties[key])
      })
    })
  }
  function similar(v1, v2){
    return (v1+"").toLowerCase().indexOf((v2+"").toLowerCase()) != -1
  }

  function serverInfo(){return {"date": Date.now(),"server": "$httpf","connection": "close"}}
  function requestInfo(method, url, data){
    return {
      method: "POST",
      headers: {"HTTPF-HEADERS": 0},
      url: url,
      data: data
    }
  }

  this.success = function(fn){
    if (this.vals) fn.apply({}, this.vals)
    return this
  }

  this.error = function(fn){
    if (this.errs) fn.apply({}, this.errs)
    return this
  }

  this.post = function(route, data){
    var oroute = route
    try {
      if (route.slice(0, 1) === "/") route = route.slice(1)
      var path = route.split("/").join(".")
      if (path.slice(-1) === ".") {         // collection
        path = path.slice(0, -1)
        var ar = pathval.get(this.api, path)
        ar.push(data)
        data = ar
      }
      pathval.set(this.api, path, data)
      this.vals = [{ok: 1, n: 0, err: null, errmsg: null}, 200, serverInfo, requestInfo("POST", oroute, data)]
    } catch (e) {
      this.errs = [JSON.stringify(e), 400, serverInfo, requestInfo("POST", oroute, data)]
    }
    return this
  }


  this.get = function(route){
    var oroute = route,
        query  = {}                 // Init query object
    try {
      if (route.slice(-1) === "/") route = route.slice(0, -1)
      if (route.slice(0, 1) === "/") route = route.slice(1)
      if (route.indexOf("?") >= 0) {    // Check for qs
        var parts = route.split("?"),   // Split to [route, qs]
            qstr  = parts.slice(-1)[0], // Get qs
            amp   = qstr.split("&")     // Split each query
        for (var i in amp) {
          var b = amp[i].split("=")     // Split/assign k & v to query object after decode
          query[decodeURIComponent(b[0])] = decodeURIComponent(b[1])
        }
        route = parts[0] // Re-assign route variable to route without a qs
      }
      var res = pathval.get(this.api, route.split("/").join(".")) // Map route to json api
      if (Array.isArray(res) && query) {       // Collection and qs?
        if (typeof query.q === "string") {     // Check if full text search
          var newRes = []
          for (var i=0;i<res.length;i++) {     // Iterate through objects & attrs
            var ob = res[i]
            for (var k in ob) {
              if (similar(ob[k], query.q)) {   // Check if val exists, case insensitive
                newRes.push(ob)                // Break & push when match
                break
              }
            }
          }
          if (Object.keys(query).length > 1) { // Check if other qs k's & v's aside from q
            delete query.q                     // Delete q and filter by other k's & v's
            newRes = filterByQuery(newRes, query)
          }
          res = newRes
        } else if (query) {               // Else if qs, but not collection
          res = filterByQuery(res, query) // Match via qs
        }
      }
      if (!res) throw new Error(404)
      this.vals = [res, 200, serverInfo, requestInfo("GET", oroute, query)]          // Should clone query to make query.q show up here
    } catch(e) {
      this.errs = ["Not Found", 404, serverInfo, requestInfo("GET", oroute, query)]
    }
    return this
  }
}])

function log(a,b,c,d){console.log("<----- START LOG ----->");console.log(a,b);if(c||d){console.log(c||null,d||null)}console.log("<------ END LOG ------>")}


function convertImgToBase64URL(url, callback, outputFormat){
  var img = new Image();
  img.crossOrigin = 'Anonymous';
  img.onload = function(){
    var canvas = document.createElement('CANVAS'),
    ctx = canvas.getContext('2d'), dataURL;
    canvas.height = img.height;
    canvas.width = img.width;
    ctx.drawImage(img, 0, 0);
    dataURL = canvas.toDataURL(outputFormat);
    callback(dataURL);
    canvas = null; 
  };
  img.src = url;
}