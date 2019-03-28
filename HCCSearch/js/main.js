/*============================================================================
 * @author Derry Everson
 *
 * Work:
 * https://www.catalystmedicalgroup.com
 * deverson@valleymedicalcenter.com
 * Personal:
 * https://www.arachnidserver.com
 * dneverson@lcmail.lcsc.edu
 *
 * Sources for this can be found at:
 * https://gitlab.com/dneverson/hccsearch
 * https://github.com/dneverson/HCCSearch
 * Date: 03/25/2019
 *============================================================================*/

var app = angular.module("MyApp", []);

app.controller("MyCtrl", function($scope, $http){

  /*=======================================================================*
  * Global Varibles
  *========================================================================*/
  var jsonFile;

  /*=======================================================================*
  * Gets json file from external local file
  *========================================================================*/
  $http.get('./data/Problems.json').then(function(response) {
    jsonFile = response.data;
  });

  /*=======================================================================*
  * Initiates search function from user string and modifies dom objects
  *========================================================================*/
  $scope.initSearch = function(usrstr){
    var usrlen = usrstr.length;
    if(usrstr.length == 0) $scope.problems = [];
    if(usrstr.length >= 3){
      $scope.problems = search(usrstr, jsonFile);
      clearElement("error");
      showElement("searchTable");
      if(!$scope.problems.length){
        hideElement("searchTable");
        addToElement("error", "No results containing all your search terms were found.");
      }
    }else{
      hideElement("searchTable");
      addToElement("error", "Type in the search bar for results.");
    };
  };

  /*=======================================================================*
  * checks if selected problem is in current problems.
  *========================================================================*/
  $scope.checkList = function(problem, currprob){
    if($scope.isMEL){
      for(var i=0; i<currprob.length; i++){
        if(problem.ICD10 == currprob[i].ICD10) return true;
      }
      return false;
    }
  };

  /*=======================================================================*
  * refreshes current problem table and weights for that table
  *========================================================================*/
  function updateCurrentProblemsTable(){
    $scope.currentProblems = getCurrentProblems(jsonFile);
    setTimeout(function(){checkCurrentProblemWeights();},500);
  };

  /*=======================================================================*
  * adds weights to current problem table
  *========================================================================*/
  function checkCurrentProblemWeights(){
    $scope.totalWeight = 0;
    try {
      for(var i=0; i<$scope.currentProblems.length; i++){
        var icdcode = $scope.currentProblems[i].ICD10;
        var found = searchICD10(icdcode, jsonFile);
        if(found){
          $scope.currentProblems[i].Weight = found[0].Weight;
          $scope.totalWeight += found[0].Weight;
        }
      };
      $scope.$apply();
      $scope.totalWeight = Math.round($scope.totalWeight*1000)/1000;
    }catch(e){ window.alert(e); }
  };

  /*=======================================================================*
  * Replaces MEL error message box for a better visual
  *========================================================================*/
  function alertMsg(arr, cl){
    if(cl == 0) cl = 'alert-success';
    else if(cl == 1) cl = 'alert-info';
    else if(cl == 2) cl = 'alert-warning';
    else cl = 'alert-danger';
    $scope.alert = {cl: cl,ttl: arr[1],msg: arr[0],vis: true};
    setTimeout(function(){$scope.alert.vis = false}, 1000);
  };

  /*=======================================================================*
  * initiates add problem function and updates table.
  *========================================================================*/
  $scope.addButton = function(problem){
    try{
      var rtn = addProblem("DX OF",problem.Description,"ICD10-"+icd10Normalize(problem.ICD10), getCurrentDate(), "", "" , "N", "");
      setTimeout(function(){updateCurrentProblemsTable();},500);
      alertMsg(rtn, 0);
    }catch(e){ window.alert(e) }
  };

  /*=======================================================================*
  * initiates remove problem function and updates table.
  *========================================================================*/
  $scope.removeButton = function(problem, currprob){
    for(var i=0; i<currprob.length; i++){
      if(problem.ICD10 == currprob[i].ICD10){
        var rtn = removeProblem(currprob[i].PID, getCurrentDate(), false, "Resolved");
        setTimeout(function(){updateCurrentProblemsTable();},500);
        alertMsg(rtn, -1);
        break;
      }
    }
  };

  /*=======================================================================*
  * INIT
  *========================================================================*/
  document.getElementById("searchText").focus();
  try{
    updateCurrentProblemsTable();
    $scope.isMEL = true;
  }catch(e){
    $scope.isMEL = false;
  }
});
