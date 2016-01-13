'use strict';

angular.module('HomeAbroad', ['firebase', 'ui.router', 'ui.bootstrap', 'ds.clock'])
    .config(function($stateProvider, $urlRouterProvider) {

        $urlRouterProvider.otherwise('/');

        $stateProvider
            .state('login', {
                url: '/login',
                templateUrl: 'partials/login.html',
                controller: 'loginCtrl'
            })
            .state('home', {
                url: '/',
                templateUrl: 'partials/home.html',
                controller: 'homeCtrl'
            })
            .state('profile', {
                url: '/profile/{currentUser}/{handle}',
                templateUrl: 'partials/profile.html',
                controller: 'profileCtrl'
            })
            .state('addNewConnection', {
                url: '/addconnections',
                templateUrl: 'partials/newConnections.html',
                controller: 'newConnectionsCtrl'
            })

    })

//Overall controller.  This is attached to the body tag in index.html.  
.controller('MASTER_CTRL', ['$scope', '$http', '$firebaseArray', '$firebaseObject', '$state', '$firebaseAuth', function($scope, $http, $firebaseArray, $firebaseObject, $state, $firebaseAuth) {


    $scope.changeVerification = function(verified, id) {
        $scope.userVerified = verified;
        $scope.userID = id;
        return $scope.userVerified;
    };

    $scope.isVerified = function() {
        return $scope.userVerified;
    }

    $scope.getUserID = function() {
        return $scope.userID;
    }

    $scope.$on('$viewContentLoaded', function(data){
        var x = document.getElementsByClassName('fp__btn')[0];
        console.log(x);
        console.log($state.current.name);
        console.log($state.current.name.indexOf('profile') != -1);
        $scope.isProfile = $state.current.name.indexOf('profile') != -1;
        if($scope.isProfile == true) {
            x.style.display = 'block';
        } else {
            x.style.display = 'none';
        }
    });

    

     var element = document.getElementById('pick-file');
            element.type="filepicker";
            element.setAttribute('data-fp-mimetype', 'image/*');
            element.setAttribute('data-fp-apikey', 'ASBoahVaSqCW18lS2QxQKz');
            element.onchange = function(e){
                var imgURL = JSON.stringify(e.fpfile.url);
                imgURL = imgURL.replace("\"", '');
                imgURL = imgURL.replace("\"", '');

                $scope.posts.$add({
                    'id': $scope.userObj.$id,
                    'image': imgURL,
                    'content': '',
                    'time': Firebase.ServerValue.TIMESTAMP,
                    'handle': $scope.userObj.handle
                });
            };
        




    var ref = new Firebase("https://homeabroad.firebaseio.com/");
    var posts = ref.child('posts');
    var users = ref.child('users');
    var Auth = $firebaseAuth(ref);
    /* create a $firebaseObject for the users reference and add to scope (as $scope.users) */
    $scope.posts = $firebaseArray(posts);
    $scope.users = $firebaseObject(users);

    var authData = Auth.$getAuth(); //get if we're authorized
    if (authData) {
        $scope.userId = authData.uid;
        $scope.userObj = $firebaseObject(ref.child('users').child($scope.userId));
        // if(authData.facebook.profileImageURL == null) {
        //     $scope.userObj.avatar = authData.facebook.profileImageURL;
        // }
        // console.log($scope.userObj);
        $state.go('home');
    } else {
        $state.go('login');
    }

}])


//This is the controller for the intial login page.  This is the first page the user sees. 
.controller('loginCtrl', ['$scope', '$firebaseObject', '$firebaseAuth', '$location', '$uibModal', '$state', function($scope, $firebaseObject, $firebaseAuth, $location, $uibModal, $state) {

    /* define reference to your firebase app */
    var ref = new Firebase("https://homeabroad.firebaseio.com/");

    /* define reference to the "users" value in the app */
    var users = ref.child('users');

    /* create a $firebaseObject for the users reference and add to scope (as $scope.users) */
    $scope.users = $firebaseObject(users);
    var Auth = $firebaseAuth(ref);

    $scope.userObj = {};

    $scope.signUp = function() {
        Auth.$unauth();
        console.log("creating user " + $scope.userObj.email);
        //pass in an object with the new 'email' and 'password'
        Auth.$createUser({
                'email': $scope.userObj.email,
                'password': $scope.userObj.password
            }).then($scope.signUpsignIn)
            .then(function(authData) {

                if ($scope.userObj.avatar === undefined) {
                    $scope.userObj.avatar = "NA"
                }

                var newUserInfo = {
                    'handle': $scope.userObj.handle,
                    'avatar': $scope.userObj.avatar,
                    'mood': 'smile',
                    'weather': 'sun-o'
                };

                $scope.users[authData.uid] = newUserInfo;

                $scope.users.$save();

                $scope.userID = authData.uid;
            }).then($scope.autoRedirect)
            .catch(function(error) {
                //error handling (called on the promise)
                console.log("sign up error");
                console.log(error);
            })
    };

    //Make LogOut function available to views
    $scope.logOut = function() {
        Auth.$unauth(); //"unauthorize" to log out
    };

    //Any time auth status updates, set the userId so we know
    Auth.$onAuth(function(authData) {
        if (authData) { //if we are authorized
            $scope.userId = authData.uid;
        } else {
            $scope.userId = undefined;
        }
    });

 
        var authData = Auth.$getAuth(); //get if we're authorized
        if (authData) {
            $scope.userId = authData.uid;
            $location.path('/');
        }
   
    //There are two sign in functions because there was a problem with
    //A user signing up (creating an account) and then being redirected to a 
    //blank home page.  Alternatively, if a user was just signing in, they would just sit on the
    //login page (even if they were authenticated).

    //separate signIn function.  
    $scope.signUpsignIn = function() {
        var promise = Auth.$authWithPassword({
            'email': $scope.userObj.email,
            'password': $scope.userObj.password
        });
        return promise; //return promise so we can *chain promises*
        //and call .then() on returned value
    }

    $scope.signIn = function() {
        ref.authWithPassword({
            email: $scope.userObj.email,
            password: $scope.userObj.password
        }, function(error, authData) {
            if (error) {
                console.log("Login Failed!", error);
            } else {
                console.log("Authenticated successfully with payload:", authData);
                $location.path('/');
            }
        });
    }


    $scope.FBlogin = function() {
        ref.authWithOAuthRedirect("facebook", function(error, authData) {
          if (error) {
            console.log("Login Failed!", error);
          } else {
            // the access token will allow us to make Open Graph API calls
            console.log("hello!");
            console.log(authData.facebook.accessToken);
          }
        }, {
          scope: "user_posts" // the permissions requested
        });
    }
}])

//This controller controls the modal that helps the user reset his or her password.  
// .controller('resetPasswordCtrl', ['$scope', function($scope) {
//     var ref = new Firebase("https://ratemyclass.firebaseio.com/");

//     $scope.resetPass = function() {
//         ref.resetPassword({
//             email: $scope.email
//         }, function(error) {
//             if (error) {
//                 switch (error.code) {
//                     case "INVALID_USER":
//                         console.log("The specified user account does not exist.");
//                         break;
//                     default:
//                         console.log("Error resetting password:", error);
//                 }
//             } else {
//                 console.log("Password reset email sent successfully!");
//                 $scope.uibModalInstance.dismiss();
//             }
//         });
//     }
// }])

//This is the controller for the home page.  It loads the user and displays their profile picture
//linking to their own profile, and the people they are following.
//Can add new connections as well as logout from this controller.  
.controller('homeCtrl', ['$scope', '$http', '$state', '$firebaseAuth', '$firebaseObject', '$firebaseArray', '$location', function($scope, $http, $state, $firebaseAuth, $firebaseObject, $firebaseArray, $location) {
    var ref = new Firebase('https://homeabroad.firebaseio.com/');

    var Auth = $firebaseAuth(ref);
    var authData = Auth.$getAuth(); //get if we're authorized
    if (authData) {
        // console.log(authData);
        $scope.userId = authData.uid;
    } else {
        $location.path('login');
    }

    var users = ref.child('users');
    $scope.users = $firebaseObject(users);

    var connections = ref.child('connections');
    $scope.connections = $firebaseArray(connections);

    $scope.connectionFilter = function(connection) {
        if ($scope.userId == connection.user1) {
            $scope.user1 = true;
            return true;
        } else if ($scope.userId == connection.user2) {
            $scope.user1 = false;
            return true;
        } else {
            return false;
        }
    }

    //Make LogOut function available to views
    $scope.logOut = function() {
        ref.unauth(); //"unauthorize" to log out
        $scope.changeVerification(false, null);
        $state.go('login');
    };

}])

//This is the controller for a profile.  It displays their weather, 
//a clock and their mood.  If this is the user that is signed in, they have the option
//to change those fields.  Additionally, they can post status updates and can see 
//posts other's have made.  
//Working on integrating Facebook, Twitter, and Instagram posts.  
.controller('profileCtrl', ['$scope', '$http', '$state', '$firebaseObject', '$stateParams', '$firebaseArray', '$firebaseAuth', function($scope, $http, $state, $firebaseObject, $stateParams, $firebaseArray, $firebaseAuth) {
    var ref = new Firebase('https://homeabroad.firebaseio.com/');
    $scope.userObj = $firebaseObject(ref.child('users').child($stateParams.handle));

    //Working on FB integration.
    // $http({
    //   method: 'GET',
    //   url: 'https://graph.facebook.com/oauth/access_token?client_id=1632727360323742&client_secret=4fe6b6b3ce31732b3afc30c3f7cec315&grant_type=client_credentials'
    // }).then(function successCallback(accessToken) {
    //     console.log(accessToken);
    //        $http({
    //           method: 'GET',
    //           url: 'https://graph.facebook.com/joe.pollock.336?access_token=' + accessToken.data
    //         }).then(function successCallback(response) {
    //             console.log(response);

    //           }, function errorCallback(response) {
    //             // called asynchronously if an error occurs
    //             // or server returns response with an error status.
    //           });
    //   }, function errorCallback(response) {
    //     // called asynchronously if an error occurs
    //     // or server returns response with an error status.
    //   });

    //Gets their position to adjust the clock accordingly.  
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
    } else {
        console.log("Geolocation is not supported by this browser.");
    }

    function showPosition(position) {
        // console.log("Latitude: " + position.coords.latitude +
        //     " Longitude: " + position.coords.longitude);

        $http({
            method: 'GET',
            url: 'http://api.geonames.org/timezoneJSON?lat=' + position.coords.latitude + '&lng=' + position.coords.longitude + '&username=demo'
        }).then(function successCallback(response) {
            console.log(response);
            $scope.gmtValue = response.data.gmtOffset;// + 12; //The time doesn't seem to be right even though 
            //It is returning the correct GMT offset.   
        }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
        });
    }

    if ($stateParams.currentUser == 'true') {
        $scope.isCurrentUser = true;
    } else {
        $scope.isCurrentUser = false;
    }

    var posts = ref.child('posts');
    $scope.posts = $firebaseArray(posts);

    $scope.postFilter = function(post) {
        if (post.id == $stateParams.handle) {
            return true;
        } else {
            return false;
        }
    }

    $scope.currentTime = Date.now();

    $scope.updateMood = function(mood) {
        $scope.userObj.mood = mood;
        $scope.userObj.$save();
    }

    $scope.moodSelected = function(mood) {
        if ($scope.userObj.mood == mood) {
            return true;
        } else {
            return false;
        }
    }

    $scope.weatherSelected = function(weather) {
        if ($scope.userObj.weather == weather) {
            return true;
        } else {
            return false;
        }
    }

    $scope.updateWeather = function(weather) {
        $scope.userObj.weather = weather;
        $scope.userObj.$save();
    }

    $scope.formData = {};
    $scope.updateStatus = function() {
        console.log($scope.formData.status);
        $scope.posts.$add({
            'id': $scope.userObj.$id,
            'content': $scope.formData.status,
            'time': Firebase.ServerValue.TIMESTAMP,
            'handle': $scope.userObj.handle
        });
        $scope.formData.status = '';
    }

    var Auth = $firebaseAuth(ref);
    //Test if already logged in (when page load)
    var authData = Auth.$getAuth(); //get if we're authorized
    if (authData) {
        $scope.userId = authData.uid;
        console.log($scope.userId);
        $scope.changeVerification(true, authData.uid);
    }

    $scope.currentUser = $firebaseObject(ref.child('users').child($scope.userId));

    $scope.commentData = {};
    $scope.leaveComment = function() {
        console.log($scope.commentData.status);
        $scope.posts.$add({
            'id': $scope.userObj.$id,
            'content': $scope.commentData.status,
            'time': Firebase.ServerValue.TIMESTAMP,
            'handle': $scope.currentUser.handle
        });
        $scope.commentData.status = '';
        $scope.posts.$save();
    }


}])

//This controls the view in which you can make new connections.  
//It connects with the user, and then removes them from the ng-repeat list. 
.controller('newConnectionsCtrl', ['$scope', '$http', '$state', '$firebaseArray', '$stateParams', '$firebaseAuth', function($scope, $http, $state, $firebaseArray, $stateParams, $firebaseAuth) {
    var ref = new Firebase('https://homeabroad.firebaseio.com/');

    var users = ref.child('users');
    $scope.users = $firebaseArray(users)
    $scope.people = [];
    $scope.users.$loaded().then(function(people) {
        $scope.people = people;
    });

    var connections = ref.child('connections');
    $scope.connections = $firebaseArray(connections);
    $scope.existingConnections = [];
    $scope.connections.$loaded().then(function(connections) {
        for (var i = 0; i < connections.length; i++) {
            if (connections[i].user1 == $scope.userId) {
                $scope.existingConnections.push(connections[i].user2);
            } else if (connections[i].user2 == $scope.userId) {
                $scope.existingConnections.push(connections[i].user1);
            }
        }
    });

    var Auth = $firebaseAuth(ref);
    //Test if already logged in (when page load)
    var authData = Auth.$getAuth(); //get if we're authorized
    if (authData) {
        $scope.userId = authData.uid;
        console.log($scope.userId);
        $scope.changeVerification(true, authData.uid);
    }

    $scope.peopleFilter = function(person) {
        if (person.$id == $scope.userId || $scope.existingConnections.indexOf(person.$id) != -1) {
            return false;
        }
        return true;
    }

    $scope.connect = function(person) {
        console.log(person);
        $scope.connections.$add({
            'user1': $scope.userId,
            'user2': person.$id
        });
        $scope.people.splice($scope.people.indexOf(person), 1);
    }
}])