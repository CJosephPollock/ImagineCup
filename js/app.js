'use strict';

angular.module('HomeAbroad', ['firebase', 'ui.router', 'ui.bootstrap'])
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

.controller('MASTER_CTRL', ['$scope', '$http', '$firebaseArray', '$state', function($scope, $http, $firebaseArray, $state) {

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
}])

.controller('loginCtrl', ['$scope', '$firebaseObject', '$firebaseAuth', '$location', '$uibModal', function($scope, $firebaseObject, $firebaseAuth, $location, $uibModal) {

    /* define reference to your firebase app */
    var ref = new Firebase("https://homeabroad.firebaseio.com/");

	/* define reference to the "users" value in the app */
	var users = ref.child('users');

	/* create a $firebaseObject for the users reference and add to scope (as $scope.users) */
	$scope.users = $firebaseObject(users);
	var Auth = $firebaseAuth(ref);

	$scope.userObj = {};

	$scope.signUp = function() {
	  console.log("creating user " + $scope.userObj.email);
	  //pass in an object with the new 'email' and 'password'
	  Auth.$createUser({
	    'email': $scope.userObj.email,
	    'password': $scope.userObj.password
	  }).then($scope.signIn)
	  .then(function(authData) {
	  	if($scope.userObj.avatar === undefined) {
	  		$scope.userObj.avatar = "img/no-pic.png"
	  	}

	  	var newUserInfo = {
	  		'handle':$scope.userObj.handle,
	  		'avatar':$scope.userObj.avatar,
            'mood': 'happy',
            'weather': 'sun'
	  	};

	  	$scope.users[authData.uid] = newUserInfo;

	  	$scope.users.$save();

	  	$scope.userID = authData.uid;
	  })
	  .catch(function(error){
	    //error handling (called on the promise)
	    console.log(error);
	  })
	};

	//Make LogOut function available to views
	$scope.logOut = function() {
	   Auth.$unauth(); //"unauthorize" to log out
	};

	//Any time auth status updates, set the userId so we know
	Auth.$onAuth(function(authData) {
	   if(authData) { //if we are authorized
	      $scope.userId = authData.uid;
	   }
	   else {
	      $scope.userId = undefined;
	   }
	});

	//Test if already logged in (when page load)
	var authData = Auth.$getAuth(); //get if we're authorized
	if(authData) {
	   $scope.userId = authData.uid;
	}

	//separate signIn function
	$scope.signIn = function() {
	  var promise = Auth.$authWithPassword({
	    'email': $scope.userObj.email,
	    'password': $scope.userObj.password
	  });
	  $location.path('/');
	  return promise; //return promise so we can *chain promises*
	                  //and call .then() on returned value
	};


}])

//This controller controls the modal that helps the user reset his or her password.  
.controller('resetPasswordCtrl', ['$scope', function($scope) {
    var ref = new Firebase("https://ratemyclass.firebaseio.com/");

    $scope.resetPass = function() {
        ref.resetPassword({
            email: $scope.email
        }, function(error) {
            if (error) {
                switch (error.code) {
                    case "INVALID_USER":
                        console.log("The specified user account does not exist.");
                        break;
                    default:
                        console.log("Error resetting password:", error);
                }
            } else {
                console.log("Password reset email sent successfully!");
                $scope.uibModalInstance.dismiss();
            }
        });
    }
}])

.controller('homeCtrl', ['$scope', '$http', '$state', '$firebaseAuth', '$firebaseObject', '$firebaseArray', function($scope, $http, $state, $firebaseAuth, $firebaseObject, $firebaseArray) {
    var ref = new Firebase('https://homeabroad.firebaseio.com/');
	var users = ref.child('users');
	$scope.users = $firebaseObject(users);

	var connections = ref.child('connections');
	$scope.connections = $firebaseArray(connections);


	$scope.connectionFilter = function(connection) {
		console.log(connection);
		if($scope.userId == connection.user1) {
			$scope.user1 = true;
			return true;
		} else if($scope.userId == connection.user2) {
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

    var Auth = $firebaseAuth(ref);
    //Test if already logged in (when page load)
    var authData = Auth.$getAuth(); //get if we're authorized
    if (authData) {
        $scope.userId = authData.uid;
        console.log($scope.userId);
        $scope.changeVerification(true, authData.uid);
    }
}])

.controller('profileCtrl', ['$scope', '$http', '$state', '$firebaseObject', '$stateParams', '$firebaseArray', '$firebaseAuth', function($scope, $http, $state, $firebaseObject, $stateParams, $firebaseArray, $firebaseAuth) {
    var ref = new Firebase('https://homeabroad.firebaseio.com/');
    $scope.userObj = $firebaseObject(ref.child('users').child($stateParams.handle));

    if($stateParams.currentUser == 'true') {
        $scope.isCurrentUser = true;
    } else {
        $scope.isCurrentUser = false;
    }

    var posts = ref.child('posts');
    $scope.posts = $firebaseArray(posts);

    $scope.postFilter = function(post) {
        if(post.id == $stateParams.handle) {
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
        if($scope.userObj.mood == mood) {
            return true;
        } else {
            return false;
        }
    }

    $scope.weatherSelected = function(weather) {
        if($scope.userObj.weather == weather) {
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
        $scope.posts.$add({'id':$scope.userObj.$id, 'content':$scope.formData.status, 'time':Firebase.ServerValue.TIMESTAMP, 'handle':$scope.userObj.handle});
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
        $scope.posts.$add({'id':$scope.userObj.$id, 'content':$scope.commentData.status, 'time':Firebase.ServerValue.TIMESTAMP, 'handle':$scope.currentUser.handle});
        $scope.commentData.status = '';
    }

}])


.controller('newConnectionsCtrl', ['$scope', '$http', '$state', '$firebaseArray', '$stateParams', '$firebaseAuth', function($scope, $http, $state, $firebaseArray, $stateParams, $firebaseAuth) {
    var ref = new Firebase('https://homeabroad.firebaseio.com/');

	var users = ref.child('users');
	$scope.users = $firebaseArray(users)
	$scope.users.$loaded().then(function(people) {
		$scope.people = people;
	});

    var connections = ref.child('connections');
    $scope.connections = $firebaseArray(connections);


    var Auth = $firebaseAuth(ref);
    //Test if already logged in (when page load)
    var authData = Auth.$getAuth(); //get if we're authorized
    if (authData) {
        $scope.userId = authData.uid;
        console.log($scope.userId);
        $scope.changeVerification(true, authData.uid);
    }

    $scope.peopleFilter = function(person) {
        if(person.$id == $scope.userId) {
            return false;
        }
        return true;
    }



	$scope.connect = function(person) {
		connections.push({
			'user1': $scope.userId,
			'user2': person.$id
		});
	}

	//make a connections child, which has two users.  
	//if the currently signed in account is one of those users, display the OTHER user on their home page.  
	//to get the mutual approval, have a variable titled "approved"

}])

























