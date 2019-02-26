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
 * Date: 02/07/2019
 *============================================================================*/

var app = angular.module("MyApp", []);

app.controller("MyCtrl", function($scope, $http){

  // #################### GLOBALS ####################
  $scope.logTime = {};
  $scope.open = false;

  // #################### FUNCTIONS ##################
  //GET JSON FILE
  $http.get('./data/Problems.json').then(function(response) {
    $scope.jsonFile = response.data;
  });
  // Hides an element by ID
  $scope.hideElement = function(elementID){
    document.getElementById(elementID).style.display = "none";
  };
  // Shows an element by ID
  $scope.showElement = function(elementID){
    document.getElementById(elementID).style.display = "block";
  };
  // Clears an element by ID
  $scope.clearElement = function(elementID){
    document.getElementById(elementID).innerHTML = "";
  };
  // Replaces element string by ID with given searchText
  $scope.addToElement = function(elementID, str){
    document.getElementById(elementID).innerHTML = str;
  };
  // Start time
  $scope.startTime = function(){
    $scope.logTime.start = Date.now();
  };
  // End time
  $scope.stopTime = function(){
    $scope.logTime.end = Date.now() - $scope.logTime.start;
    $scope.logTime.start = 0;
  };
  // Print timed results in console
  $scope.printTime = function(){
    if($scope.problems.length){
      console.log("Time: " + $scope.logTime.end +
      "ms, Results: " + $scope.problems.length +
      ", Records: " + $scope.jsonFile.length);
    };
  };
  // Gets current date in the format MM/DD/YYYY
  $scope.getCurrentDate = function(){
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1;
    var yyyy = today.getFullYear();
    if (dd<10)dd='0'+dd;
    if (mm<10)mm='0'+mm;
    today = mm+'/'+dd+'/'+yyyy;
    return today;
  };
  // Needed for searchJSON function
  $scope.addSlashes = function(str){
    return (str + '').replace(/[\\"'\(\)]/g,'\\$&').replace(/\u0000/g,'\\0');
  }
  // Searches JSON string with searchString by description or ICD10 code
  $scope.searchJSON = function(searchStr){
    $scope.problems = [];
    searchStr = $scope.addSlashes(searchStr).replace(' ','[^"]+');
    var jsonStr = JSON.stringify($scope.jsonFile, null,' ');
    // Search by Description
    var found1 = jsonStr.match(
      new RegExp(
        '{\\s+"icd10":\\s"\\w+",'+
        '\\s+"description":\\s.*'+ searchStr +'.*",'+
        '\\s+"weight":\\s[\\d\\.]+\\s+}'
        ,'gi')
    );
    // Search by ICD10
    var found2 = jsonStr.match(
      new RegExp(
        '{\\s+"icd10":\\s".*'+ searchStr +'.*",'+
        '\\s+"description":\\s".*",'+
        '\\s+"weight":\\s[\\d\\.]+\\s+}'
        ,'gi')
    );
    if(found1){
      $scope.problems = (JSON.parse(JSON.stringify(found1).replace(/"{/g,"{").replace(/\\n/g,"").replace(/\\/g,"").replace(/}"/g,"}")));
    }
    if(found2){
      $scope.problems = (JSON.parse(JSON.stringify(found2).replace(/"{/g,"{").replace(/\\n/g,"").replace(/\\/g,"").replace(/}"/g,"}")));
    }
  };
  // Finds duplications in a json array
  $scope.findDuplicates = function(arr){
      var object = {};
      var result = [];
      arr.forEach(function (item) {
        if(!object[item.ICD10])
            object[item.ICD10] = 0;
          object[item.ICD10] += 1;
      })
      for (var prop in object) {
         if(object[prop] >= 2) {
             result.push(prop);
         }
      }
      return result;
  };
  // Adds text to the chart notes
  $scope.addToChartNote = function(text){
    var form_Id = window.external.FormId;
    var document_variable = "DOCUMENT.TEMPHTML0_" + form_Id;
    var text_translation = text;
    window.external.SetChartValue(document_variable, text_translation);
  };
  // Checks and adds weights to current patient problems table
  $scope.checkCurrentProblemWeights = function(){
    $http.get('./data/Problems.json').then(function(response) {
      // Can remove bottom 2 lines if no longer needed
      var tmp = $scope.findDuplicates(response.data);
      $scope.addToChartNote("Duplications: " + tmp);
      var jsonStr1 = JSON.stringify(response.data, null,' ');
      // Matches and adds weight to current patient problems table
      var totalWeight = 0; //NOTE remove if not needed anymore
      for(i=0;i<$scope.currentProblems.length;i++){
        var icdcode = $scope.currentProblems[i].ICD10;
        var found0 = jsonStr1.match(
          new RegExp(
          '{\\s+"icd10":\\s".*'+ icdcode +'.*",'+
          '\\s+"description":\\s".*",'+
          '\\s+"weight":\\s[\\d\\.]+\\s+}'
          ,'gi')
        );
        if(found0){
          var normalized = (JSON.parse(JSON.stringify(found0).replace(/"{/g,"{").replace(/\\n/g,"").replace(/\\/g,"").replace(/}"/g,"}")));
          $scope.currentProblems[i].Weight = normalized[0].Weight;
          //totalWeight += normalized[0].Weight; //NOTE remove if not needed anymore
        };
      };
      //$scope.currentProblems.unshift({"ICD10": "", "Description": "TOTAL WEIGHT:", "Weight": totalWeight}); //NOTE remove if not needed anymore
    });
  };
  // Adds problem in current patient's problem list
  $scope.addProblem = function(type, desc, code, startDate, endDate, annotate, asmt, comm){
    // example: {MEL_ADD_PROBLEM(‘DX OF’,’Cholera’,’ICD-001.9’,str(._todaysdate),’’,’Pt. traveled in Africa’,’N’,’monitor for improvement’)}
    // Tested working: $scope.addProblem("DX OF","Cholera", "ICD-001.9", "09/15/2012", "", "Pt. traveled in Africa" , "N", "monitor for improvement");
    // type: DX OF = Diagnosis of (DEFAULT), MDXOF = Minor Diagnosis of (only for historical references)
    //       H/F = Hospitalized for, HX OF = History of, S/P = Status Post, R/O = Rule out, ? OF = Question of
    //       SX OF = Symptom of, RS OF = Risk of, NOTE: = Take Note of, FH OF = Family History of
    // Date formats: MM/DD/YYYY or YYYY/MM/DD
    // asmt: New or N, Improved or I, Unchanged or U, Deteriorated or D, Comment only or C
    // comm, optional (2000 char)
    var result = window.external.EvaluateMel("{MEL_ADD_PROBLEM('"+type+"','"+desc+"','"+code+"','"+startDate+"','"+endDate+"','"+annotate+"','"+asmt+"','"+comm+"')}", true);
    if(result=="0")         $scope.errorMessage("Success","MEL_ADD_PROBLEM");
    else if(result=="-1")   $scope.errorMessage("PRID is not valid","MEL_ADD_PROBLEM");
    else if(result=="-2")   $scope.errorMessage("description is too long","MEL_ADD_PROBLEM");
    else if(result=="-3")   $scope.errorMessage("code is not valid or the wrong code type","MEL_ADD_PROBLEM");
    else if(result=="-4")   $scope.errorMessage("startDate is not in the correct format","MEL_ADD_PROBLEM");
    else if(result=="-5")   $scope.errorMessage("startDate is not valid (for example, the date represents a future date)","MEL_ADD_PROBLEM");
    else if(result=="-6")   $scope.errorMessage("approxStart argument is not valid","MEL_ADD_PROBLEM");
    else if(result=="-7")   $scope.errorMessage("stopDate is not valid (for example, the date is earlier than the onset date)","MEL_ADD_PROBLEM");
    else if(result=="-8")   $scope.errorMessage("approxStop argument is not valid","MEL_ADD_PROBLEM");
    else if(result=="-9")   $scope.errorMessage("comment is not valid or too long","MEL_ADD_PROBLEM");
    else if(result=="-10")  $scope.errorMessage("clinical list lock cannot be obtained","MEL_ADD_PROBLEM");
    else if(result=="-11")  $scope.errorMessage("problem cannot be changed for some other reason","MEL_ADD_PROBLEM");
    else                    $scope.errorMessage("Error: unkown reason, returned value: "+ result,"MEL_ADD_PROBLEM");
  };
  // Removes problem in current patient's problem list
  $scope.removeProblem = function(PRID, endDate, approx, reason){
    // example: MEL_REMOVE_PROBLEM(PRID, “09/15/2012”, false, “Resolved”)
    // Tested working: $scope.removeProblem(1830777798699680, "09/15/2018", false, "Correction");
    // Date formats: MM/DD/YYYY or YYYY/MM/DD
    // Reasons: "Resolved", "Inactive", "Ruled out" or "Correction". Default is "Resolved".
    var result = window.external.EvaluateMel("{MEL_REMOVE_PROBLEM("+PRID+",'"+endDate+"','"+approx+"','"+reason+"')}", true);
    if(result=="0")         $scope.errorMessage("Success","MEL_REMOVE_PROBLEM");
    else if(result=="-1")   $scope.errorMessage("problem is not found","MEL_REMOVE_PROBLEM");
    else if(result=="-2")   $scope.errorMessage("problem is found and it is already inactive","MEL_REMOVE_PROBLEM");
    else if(result=="-3")   $scope.errorMessage("endDate is not valid","MEL_REMOVE_PROBLEM");
    else if(result=="-4")   $scope.errorMessage("approx argument is not either true or false","MEL_REMOVE_PROBLEM");
    else if(result=="-5")   $scope.errorMessage("Reason is Invalid","MEL_REMOVE_PROBLEM");
    else if(result=="-6")   $scope.errorMessage("data symbol cannot obtain the clinical list lock","MEL_REMOVE_PROBLEM");
    else if(result=="-7")   $scope.errorMessage("other problem is encountered","MEL_REMOVE_PROBLEM");
    else                    $scope.errorMessage("Error: unkown reason, returned value: "+ result,"MEL_REMOVE_PROBLEM");
  };
  // Opens a Error message window in CPS with a message and title
  $scope.errorMessage = function(message, title){
    // Tested: $scope.errorMessage("Invalid format specified","MEL_LIST_CARE_PLAN");
    window.external.ShowErrorMessageBox(message, title);
  };
  // formats the icd10 code for correct comparisons
  $scope.icd10Parse = function(icd10){
    if(icd10.length > 3) var result = (icd10.slice(0,3)+"."+icd10.slice(3));
    else var result = (icd10);
    return result;
  };
  // compares list problem to current patient problem
  $scope.icd10Compare = function(first, second){
    var result;
    if(!second){
      if(first.stopdate == "\/Date(86181955200000)\/" && (first.stopreason == null || first.stopreason.replace(" ", "") == "")) result = true;
    }
    else if(first == second.ICD10 && second.stopdate == "\/Date(86181955200000)\/" && (second.stopreason == null || second.stopreason.replace(" ", "") == "")) result = true;
    else result = false;
    return result;
  };
  // checks to see if the add or remove button needs to be in place
  $scope.checkList = function(problem){
    try{
      var currprob = $scope.getCurrentProblems();
      var icd10Code = $scope.icd10Parse(problem.ICD10);
      $scope.onList = false;
      $scope.offList = true;
      for(i=0;i<currprob.length;i++){
        if($scope.icd10Compare(icd10Code, currprob[i])){
          $scope.onList = true;
          $scope.offList = false;
          break;
        }
      }
    }catch(err){
      $scope.onList = false;
      $scope.offList = false;
    }
  };
  // Function shows table when there is data to be displayed ad hides the Table
  // when there is no data to be displayed. Also displayes warning and error
  // messages. Calls the search function.
  $scope.displayTable = function(){
    if( $scope.userStr.length == 0){
      $scope.problems = [];
    }
    if( $scope.userStr.length >= 3){
      $scope.startTime();
      $scope.clearElement("error");
      $scope.showElement("searchTable");
      var searchText = $scope.userStr.toLowerCase();
      $scope.searchJSON(searchText);
      $scope.stopTime();
      $scope.printTime();
      if($scope.problems.length == 0){
        $scope.hideElement("searchTable");
        $scope.addToElement("error", "No results containing all your search terms were found.");
      }
    }else{
      $scope.hideElement("searchTable");
      $scope.addToElement("error", "Type in the search bar for results.");
    };
  };
  //For Testing Only Hover Mode on off button
  $scope.toggleExpand = function(element, cssClass){

    if (document.getElementById(element).classList.contains(cssClass)){
      document.getElementById(element).classList.remove(cssClass);
    }else{
      document.getElementById(element).classList.add(cssClass);
    }
  };
  $scope.toggleProblemsTable = function(element, cssClass){
    if (document.getElementById(element).classList.contains(cssClass)){
      document.getElementById(element).classList.remove(cssClass);
    }else{
      document.getElementById(element).classList.add(cssClass);
    }
  };
  // Gets and parses current patient problems and pushes relevent information needed
  $scope.getCurrentProblems = function(){
    var prob = JSON.parse(window.external.problems);
    var result = [];
    for(i=0; i<prob.length; i++){
      try{
        var isICD10Valid = (prob[i].icd10CodeDetail != null)?true:false;
        result.push({
          pid: prob[i].problemID,
          ICD10: (isICD10Valid)?prob[i].icd10CodeDetail.code:"NA",
          Description: (isICD10Valid)?prob[i].icd10CodeDetail.longDescription:"NA",
          stopdate: prob[i].stopdate,
          stopreason: prob[i].stopreason
        });
      }catch(err){
        window.alert(err);
      }
    }
    return result;
  };
  // gets and updates currentproblems for table
  $scope.updateCurrentProblemsTable = function(){
    $scope.currentProblems = [];
    var currentProblemList = $scope.getCurrentProblems();
    for(i=0;i<currentProblemList.length;i++){
      if($scope.icd10Compare(currentProblemList[i])){
        $scope.currentProblems.push({
          ICD10: currentProblemList[i].ICD10.replace(".",""),
          Description: currentProblemList[i].Description,
          Weight: 0
        });
      };
    };
    $scope.checkCurrentProblemWeights();
  };
  // Runs the addProblem function and safeguards from adding multipule problems
  $scope.addButton = function(problem){
    var currentdate = $scope.getCurrentDate();
    var icd10Code = $scope.icd10Parse(problem.ICD10);
    var currprob = $scope.getCurrentProblems();
    var active = false;
    if(currprob.length == 0){
      $scope.addProblem("DX OF",problem.Description,"ICD10-"+icd10Code, currentdate, "", "" , "N", "");
    }else{
      for(i=0;i<currprob.length;i++){
        if($scope.icd10Compare(icd10Code, currprob[i])){
          active = true;
        }
        if(!active && i == currprob.length-1){
          $scope.addProblem("DX OF",problem.Description,"ICD10-"+icd10Code, currentdate, "", "" , "N", "");
        }
      }
    }
    $scope.updateCurrentProblemsTable();
  };
  // Runs the removeProblem function and safeguards from removing multipule problems
  $scope.removeButton = function(problem){
    var currentdate = $scope.getCurrentDate();
    var icd10Code = $scope.icd10Parse(problem.ICD10);
    var currprob = $scope.getCurrentProblems();
    for(i=0;i<currprob.length;i++){
      if($scope.icd10Compare(icd10Code, currprob[i])){
        $scope.removeProblem(currprob[i].pid, currentdate, false, "Resolved");
        break;
      }
    }
    $scope.updateCurrentProblemsTable();
  };

  // ################## CALL FUNCTIONS ################
  $scope.addToElement("error", "Type in the search bar for results.");
  document.getElementById("searchText").focus();
  try{
    $scope.showElement("problemsTable");
    $scope.updateCurrentProblemsTable();
  }catch(err){
    $scope.hideElement("problemsTable");
    $scope.hideElement("hoverBtn");
    $scope.hideElement("updateCurrentProblemsBtn");
    $scope.currentProblems = [];
  }
});
