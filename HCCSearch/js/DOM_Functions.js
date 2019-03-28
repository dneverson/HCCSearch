/*=======================================================================*
* Hides an element by ID
*========================================================================*/
function hideElement(elementID){
  document.getElementById(elementID).style.display = "none";
};

/*=======================================================================*
* Shows an element by ID
*========================================================================*/
function showElement(elementID){
  document.getElementById(elementID).style.display = "block";
};

/*=======================================================================*
* Shows or Hides an element by ID
*========================================================================*/
function toggleElement(elementID){
  var elmnt = document.getElementById(elementID).style.display;
  if(elmnt == "none") document.getElementById(elementID).style.display = "block";
  if(elmnt == "block") document.getElementById(elementID).style.display = "none";
};



/*=======================================================================*
* Clears an element by ID
*========================================================================*/
function clearElement(elementID){
  document.getElementById(elementID).innerHTML = "";
};

/*=======================================================================*
* Replaces element string by ID with given searchText
*========================================================================*/
function addToElement(elementID, str){
  document.getElementById(elementID).innerHTML = str;
};

/*=======================================================================*
* Expands or Retracts current pateint problems table
*========================================================================*/
function expandCurProbTbl(element, cssClass){
  if (document.getElementById(element).classList.contains(cssClass)){
    document.getElementById(element).classList.remove(cssClass);
  }else{
    document.getElementById(element).classList.add(cssClass);
  }
};

/*=======================================================================*
* For Testing Only, Hover Mode on off button
*========================================================================*/
function toggleHover(element, cssClass){
  if (document.getElementById(element).classList.contains(cssClass)){
    document.getElementById(element).classList.remove(cssClass);
  }else{
    document.getElementById(element).classList.add(cssClass);
  }
};
