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

/*============================================================================
* NOTE: IF you are having issues with a certian problem being replaced
  look in the EMR problems to see if there is 2 of the same problem but with
  diffrent descriptions. This can cause issues with this form.
*============================================================================*/

var app = angular.module("MyApp", []);

app.controller("MyCtrl", function($scope, $http){

  /*=======================================================================*
  * Global Varibles
  *========================================================================*/
  var jsonFile;
  var prevRecommend = [];

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
      if(!$scope.problems.length){
        $scope.error.msg = "No results containing all your search terms were found.";
      }
    }else{
      $scope.error.msg = "Type in the search bar for results.";
    };
  };

  /*=======================================================================*
  * checks if selected problem is in current problems.
  *========================================================================*/
  $scope.checkList = function(problem, currprob){
    if($scope.isMEL){
      for(var i=0; i<currprob.length; i++){
        if(problem.ICD10.toLowerCase() == currprob[i].ICD10.toLowerCase()){
          return true;
        }
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
    setTimeout(function(){getRecommendations();},500);
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
    }catch(e){ console.log(e); } // window.alert(e);
  };

  /*=======================================================================*
  * Gets recommendations for possible higher weighted problems
  *========================================================================*/
  function getRecommendations(){
    for(var i=0; i<$scope.currentProblems.length; i++){
      try{
        var subCode = $scope.currentProblems[i].ICD10.substring(0,3);
        var result = searchICD10(subCode, jsonFile);
        if(result){
          for (var j=0; j<result.length; j++) {
            if( result[j].Weight > $scope.currentProblems[i].Weight &&
                result[j].ICD10.substring(0,3) == $scope.currentProblems[i].ICD10.substring(0,3)
              ){
              $scope.currentProblems[i].Recommendations.push(result[j]);
            }
          }
        }
      }catch(e){ console.log(e); }
    }
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
      if(problem.ICD10.toLowerCase() == currprob[i].ICD10.toLowerCase()){
        var rtn = removeProblem(currprob[i].PID, getCurrentDate(), false, "Resolved");
        setTimeout(function(){updateCurrentProblemsTable();},500);
        alertMsg(rtn, -1);
        break;
      }
    }
  };

  /*=======================================================================*
  * initiates replacing a old problem with a new problem and updates table.
  * ERROR TIMING ISSUES FIX LATER
  *========================================================================*/
  $scope.replaceButton = function(problem, rcmd, currprob){
    setTimeout(function(){$scope.removeButton(rcmd, currprob);},500);
    setTimeout(function(){$scope.addButton(problem);},500);
    setTimeout(function(){updateCurrentProblemsTable();},500);
    $scope.Rcmds = 0;
    alertMsg(["Success","Replaced Problem:"], 1);
  };

  /*=======================================================================*
  * initiates remove problem function and updates table.
  *========================================================================*/
  $scope.recommendButton = function(problem){
    if(prevRecommend == problem && $scope.Rcmds !== "") $scope.Rcmds = "";
    else{
      prevRecommend = problem;
      $scope.Rcmds = problem;
    }
  };

  /*=======================================================================*
  * indicates which element in the table was clicked, Sets master
  *========================================================================*/
  $scope.setMaster = function(section) {
    if($scope.Rcmds !== "") $scope.selected = section;
    else $scope.selected = "";
  };

  /*=======================================================================*
  * indicates which element in the table was clicked, checks if selected
  *========================================================================*/
  $scope.isSelected = function(section) {
    return $scope.selected === section;
  };

  /*=======================================================================*
  * INIT
  *========================================================================*/
  document.getElementById("searchText").focus();
  try{
    $scope.error = {
      msg: "Type in the search bar for results.",
      vis: true
    };
    updateCurrentProblemsTable();
    $scope.isMEL = true;
  }catch(e){
    $scope.isMEL = false;
  }
});
