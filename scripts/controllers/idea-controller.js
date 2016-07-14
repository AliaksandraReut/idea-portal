'use strict';
angular.module('tp')
    .controller('mainController', function($scope, $rootScope, TT, ideaFactory, likeFactory) {
            $scope.tt = ideaFactory.getTechTalk();
            $scope.ideasList = ideaFactory.getAll();
            $scope.openAddIdea=false;

            $scope.$on('createdTechTalk', function(e, data){
                $scope.tt = ideaFactory.getTechTalk();
                $scope.ideasList = ideaFactory.getAll();
            });
            $scope.addIdea = function(){
                if ($scope.ideaText && $rootScope.global.isAuthN) {
                    var idea = ideaFactory.post($scope.ideaText);
                    $scope.ideasList.unshift(idea);
                    $scope.ideaText='';
                    $scope.openAddIdea=false;
                }
            };

            $scope.toggleLike = function(e, index){
                var idea = $scope.ideasList[index],
                    ind;
                if ($rootScope.global.isAuthN) {
                    ind = idea.likes.indexOf($rootScope.global.currentUser._id);
                    if (!~ind) {
                        likeFactory.post(idea._id);
                        idea.likes.push($rootScope.global.currentUser._id);
                    } else {
                        likeFactory.delete(idea._id);
                        idea.likes.splice(ind, 1);
                    }
                }
                e.stopPropagation();
                e.preventDefault();
            };

            $scope.clearIdea = function(){
                $scope.ideaText='';
                $scope.openAddIdea=false;
            };
        })
    .controller('commentsController', function($scope, $rootScope, $filter, commentFactory, likeFactory, $routeParams, ideaFactory, userFactory,$location) {
            var ideaId = $routeParams.ideaId,
                ideas, idea;

        $scope.$parent.ideasList.$promise.then(function(val){
            ideas = $filter('filter')(val, {_id: ideaId});
            if (ideas.length) {
                idea = ideas[0];
                idea.comments = commentFactory.getAll(ideaId);
                $scope.ideaWithComment = idea;
                console.log($scope.ideaWithComment);
            }else{
                $scope.ideaWithComment = $scope.$parent.tt;
            }
        });

            $scope.allUsers=userFactory.getAll();

            $scope.removeComment = function(index){
                var comment = $scope.ideaWithComment.comments[index];
                if ($rootScope.global.isAuthN && (comment.author._id === $rootScope.global.currentUser._id)) {
                    commentFactory.remove(comment);
                    $scope.ideaWithComment.comments.splice(index, 1);
                }
            };
            $scope.createTechTalk = false;
            $scope.submitTechTalk = function(){
                var addedTechalk = function(){
                    $scope.$emit('createdTechTalk');
                    $location.path('#/');
                    $scope.lectorMistake = null;
                    $scope.dateMistake = null;
                };
                if( $rootScope.global.isAuthN && $rootScope.global.currentUser.role === 'admin'){
                    if(!$scope.ideaWithComment.ttDate) {
                        $scope.dateMistake = "It's necessary to choose the date";
                    }else if((!$scope.ideaWithComment.ttLector && $scope.talkType) || ($scope.ideaWithComment.ttLector && $scope.talkType)){
                        ideaFactory.update(ideaId, 'techtalk', $scope.ideaWithComment, null);
                        addedTechalk();
                    }else if (!$scope.ideaWithComment.ttLector) {
                        $scope.lectorMistake = "It's necessary to choose the lector";
                    }else{
                        ideaFactory.update(ideaId, 'techtalk', $scope.ideaWithComment, $scope.ideaWithComment.ttLector._id);
                        addedTechalk();
                    }
                }
            };
            $scope.updateIdea=function(){
                if( $rootScope.global.isAuthN){
                    ideaFactory.update(ideaId, 'idea', $scope.ideaWithComment);
                }
                $scope.toUpdateIdea=false;
            };

            $scope.addComment = function(){
                if ($scope.commentText && $rootScope.global.isAuthN) {
                    var comment = commentFactory.post($scope.ideaWithComment._id, $scope.commentText);
                    $scope.ideaWithComment.comments.push(comment);
                    $scope.commentText = '';
                }
            };

            $scope.toggleLike = function(e){
                var ind = $scope.ideaWithComment.likes.indexOf($rootScope.global.currentUser._id);
                if ($rootScope.global.isAuthN){
                    if (!~ind) {
                        likeFactory.post($scope.ideaWithComment._id);
                        $scope.ideaWithComment.likes.push($rootScope.global.currentUser._id);
                    } else {
                        likeFactory.delete($scope.ideaWithComment._id);
                        $scope.ideaWithComment.likes.splice(ind, 1);
                    }
                }
                e.stopPropagation();
                e.preventDefault();
            };

            $scope.closeComment = function(popupId){
                $scope.commentText = '';
                var popup_id = $('#' + popupId);
                popup_id.hide("fast");
            }
        })
    .filter('count', function(){
        return  function(array){
            if(typeof array === 'object'){
                return array.length;
            }
        }
    })
    .filter('countComments', function(){
        return  function(array){
            if(typeof array === 'object'){
                var length=array.length;
                if(length==1){
                    return length+"  Комментарий";
                }else if(length>1&&length<5){
                    return length+"  Комментария";
                }else{
                    return length+"  Комментариев";
                }
            }
        }
    });
