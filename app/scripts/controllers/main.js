'use strict';

angular.module('fiveStarApp')
.controller('MainCtrl', function ($scope, $routeParams, $location, debounce, ngProgress, $http, $q) {

    $scope.state = {
        query: $routeParams.query || '',
        index: $routeParams.index || 'All',
        node: parseInt($routeParams.node, 10) || undefined,
        brand: $routeParams.brand,
        onlyAmazon: $routeParams.onlyAmazon
    };
    $scope.previousStates = [angular.copy($scope.state)];

    $scope.loading = false;

    ngProgress.color('#4FC1E9');
    $scope.canceler = $q.defer();

    $scope.$watch('state', function() {
        // update URL on state change and save to previousStates

        // error check
        if ($scope.state.query === undefined || $scope.state.index === undefined) {
            return;
        }
        if ($scope.state.query.length === 0) {
            return;
        }

        // should clear if index is different
        // -> clears node and brand values if index changes cause they're likely to screw things up
        var indexChanged = ($scope.state.index !== $scope.previousStates[$scope.previousStates.length-1].index);
        // should push if node or brand is different
        // -> only push to history if they change AND we care about their values
        var newState = ((!indexChanged) && (($scope.state.node !== $scope.previousStates[$scope.previousStates.length-1].node) ||
                         ($scope.state.brand !== $scope.previousStates[$scope.previousStates.length-1].brand)));

        if (indexChanged) {
            $scope.state.node = undefined;
            $scope.state.brand = undefined;
            // reset previousStates
            $scope.previousStates = [angular.copy($scope.state)];
        }

        if (newState) {
            $scope.previousStates.push(angular.copy($scope.state));
        }

        // now sync the state to the url
        angular.forEach($scope.state, function(v, k) {
            $location.search(k, v);
        });

        // swag, now call getData
        $scope.getData();

    }, true);


    $scope.getData = debounce(500, function() {
        // pass the state to the backend to get the data
        $scope.canceler.resolve();
        $scope.canceler = $q.defer();

        $scope.loading = true;
        $scope.results = undefined;
        ngProgress.start();

        $http.get('/api/search', {
            params: $scope.state,
            timeout: $scope.canceler.promise
        }).success(function(data) {
            $scope.results = data;
            ngProgress.complete();
            $scope.loading = false;
            console.log($scope.results);
        });


    });


    $scope.selectBin = function(bin) {
        if (bin.Name === 'Brand') {
            $scope.state.brand = bin.Value;
        } else if (bin.Name === 'BrowseNode') {
            $scope.state.node = bin.Value;
        } else if (bin.Name === 'SearchIndex') {
            $scope.state.index = bin.Value;
        }
    };

});
