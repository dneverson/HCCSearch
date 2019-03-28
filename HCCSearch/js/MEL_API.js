/*=======================================================================*
* Gets and parses current patient problems
*========================================================================*/
function getCurrentProblems(jsonFile){
  var prob = JSON.parse(window.external.problems);
  var result = [];
  for(i=0; i<prob.length; i++){
    if(prob[i].stopdate == "\/Date(86181955200000)\/" &&
    (prob[i].stopreason == null || prob[i].stopreason.replace(" ", "") == "")){
      var isICD10Valid = (prob[i].icd10CodeDetail != null)?true:false;
      result.push({
        PID: prob[i].problemID,
        ICD10: (isICD10Valid)?prob[i].icd10CodeDetail.code.replace(".",""):"NA",
        Description: (isICD10Valid)?prob[i].icd10CodeDetail.longDescription:"NA",
        stopdate: prob[i].stopdate,
        stopreason: prob[i].stopreason,
        Weight: 0
      });
    }
  }
  return result;
};

/*=======================================================================*
* Gets current date in the format MM/DD/YYYY
*========================================================================*/
function getCurrentDate(){
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth()+1;
  var yyyy = today.getFullYear();
  if (dd<10)dd='0'+dd;
  if (mm<10)mm='0'+mm;
  today = mm+'/'+dd+'/'+yyyy;
  return today;
};

/*=======================================================================*
* Opens a Error message window in CPS with a message and title
*========================================================================*/
function msgBox(msg, ttl, cl){
  window.external.ShowErrorMessageBox(msg, ttl);
};

/*=======================================================================*
* Adds problem in current patient's problem list
*========================================================================*/
function addProblem(type, desc, code, startDate, endDate, annotate, asmt, comm){
  var result = window.external.EvaluateMel("{MEL_ADD_PROBLEM('"+type+"','"+desc+"','"+code+"','"+startDate+"','"+endDate+"','"+annotate+"','"+asmt+"','"+comm+"')}", true);
  if(result=="0")         return ["Success","Add Problem:"];
  else if(result=="-1")   return ["PRID is not valid","Add Problem:"];
  else if(result=="-2")   return ["description is too long","Add Problem:"];
  else if(result=="-3")   return ["code is not valid or the wrong code type","Add Problem:"];
  else if(result=="-4")   return ["startDate is not in the correct format","Add Problem:"];
  else if(result=="-5")   return ["startDate is not valid (for example, the date represents a future date)","Add Problem:"];
  else if(result=="-6")   return ["approxStart argument is not valid","Add Problem:"];
  else if(result=="-7")   return ["stopDate is not valid (for example, the date is earlier than the onset date)","Add Problem:"];
  else if(result=="-8")   return ["approxStop argument is not valid","Add Problem:"];
  else if(result=="-9")   return ["comment is not valid or too long","Add Problem:"];
  else if(result=="-10")  return ["clinical list lock cannot be obtained","Add Problem:"];
  else if(result=="-11")  return ["problem cannot be changed for some other reason","Add Problem:"];
  else                    return ["Error: unkown reason, returned value: "+ result,"Add Problem:"];
};

/*=======================================================================*
* Removes problem in current patient's problem list
*========================================================================*/
function removeProblem(PRID, endDate, approx, reason){
  var result = window.external.EvaluateMel("{MEL_REMOVE_PROBLEM("+PRID+",'"+endDate+"','"+approx+"','"+reason+"')}", true);
  if(result=="0")         return ["Success","Remove Problem:"];
  else if(result=="-1")   return ["problem is not found","Remove Problem:"];
  else if(result=="-2")   return ["problem is found and it is already inactive","Remove Problem:"];
  else if(result=="-3")   return ["endDate is not valid","Remove Problem:"];
  else if(result=="-4")   return ["approx argument is not either true or false","Remove Problem:"];
  else if(result=="-5")   return ["Reason is Invalid","Remove Problem:"];
  else if(result=="-6")   return ["data symbol cannot obtain the clinical list lock","Remove Problem:"];
  else if(result=="-7")   return ["other problem is encountered","Remove Problem:"];
  else                    return ["Error: unkown reason, returned value: "+ result,"Remove Problem:"];
};
