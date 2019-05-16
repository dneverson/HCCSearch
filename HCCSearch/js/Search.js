/*=======================================================================*
* Needed for correct adding problem by icd10 code
*========================================================================*/
function icd10Normalize(icd10){
  if(icd10.length > 3) var result = (icd10.slice(0,3)+"."+icd10.slice(3));
  else var result = (icd10);
  return result;
};

/*=======================================================================*
* Parse and strip user string
*========================================================================*/
function stripStr(str){
  return (str).toLowerCase().replace(/[^a-z0-9 ]/g, "");
};

/*=======================================================================*
* Gets All permutations of provided string
*========================================================================*/
function getAllPermutations(arr,permArr,used){
  var i, j, permArr=permArr?permArr:[], used=used?used:[];
  for(i=0; i<arr.length; i++){
    j = arr.splice(i,1)[0];
    used.push(j);
    if(arr.length==0)permArr.push(used.join(" ")); // save a for loop each permutation
    getAllPermutations(arr,permArr,used);
    arr.splice(i,0,j);
    used.pop();
  }
  return permArr
};

/*=======================================================================*
* Needed to bypass words. exp search str = "cow blue", "The cow is blue"
* bypasses the and is to find a match.
*========================================================================*/
function addSlashes(str){
  return (str + '').replace(/[\\"'\(\)]/g,'\\$&').replace(/\u0000/g,'\\0');
};

/*=======================================================================*
* Search by ICD10 Code
*========================================================================*/
function searchICD10(str, jsonFile){
  try{
    var result;
    str = addSlashes(str).replace(' ','[^"]+');
    var jsonStr = JSON.stringify(jsonFile, null,' ');
    var found = jsonStr.match(
      new RegExp(
        '{\\s+"icd10":\\s".*'+ str +'.*",'+
        '\\s+"description":\\s".*",'+
        '\\s+"weight":\\s[\\d\\.]+\\s+}'
        ,'gi')
      );
      if(found){
        return (JSON.parse(JSON.stringify(found)
        .replace(/"{/g,"{")
        .replace(/\\n/g,"")
        .replace(/\\/g,"")
        .replace(/}"/g,"}")));
      }
  }catch(e){ console.log(e); }
};

/*=======================================================================*
* Search by Description
*========================================================================*/
function searchDesc(str, jsonFile){
  try{
    var result;
    str = addSlashes(str).replace(' ','[^"]+');
    var jsonStr = JSON.stringify(jsonFile, null,' ');
    var found = jsonStr.match(
      new RegExp(
        '{\\s+"icd10":\\s"\\w+",'+
        '\\s+"description":\\s.*'+ str +'.*",'+
        '\\s+"weight":\\s[\\d\\.]+\\s+}'
        ,'gi')
      );
      if(found){
        return (JSON.parse(JSON.stringify(found)
        .replace(/"{/g,"{")
        .replace(/\\n/g,"")
        .replace(/\\/g,"")
        .replace(/}"/g,"}")));
      }
  }catch(e){ console.log(e); }
};

/*=======================================================================*
* Joins by ICD10 codes, creating a unique array.
*========================================================================*/
function joinArrayUnique(arr){
  var result = arr.concat();
  for(var i=0; i<result.length; ++i) {
    for(var j=i+1; j<result.length; ++j) {
      if(result[i].ICD10 === result[j].ICD10) result.splice(j--, 1);
    }
  }
  return result;
};

/*=======================================================================*
* returns a full searched list from users text - Jakes method
*========================================================================*/
function search(usrstr, jsonFile){
  var arr = [];
  var searchText = stripStr(usrstr).split(" ");
  for(var i=0; i<searchText.length; i++){
    for(var j=0; j<searchText.length; j++){
      if(i != j && searchText[i] == searchText[j]) searchText.splice(i--, 1);
    }
  }
  var s1 = searchICD10(searchText, jsonFile);
  if(s1) return s1;
  for (var i=0; i<searchText.length; i++){
    if(!i)var s2 = searchDesc(searchText[i], jsonFile)
      else var s2 = searchDesc(searchText[i], arr);
    if(!s2) return [];
      else arr = JSON.parse(JSON.stringify(s2));
  }
  return arr;
};

/*=======================================================================*
* returns a full searched list from users text - Permutation method
*========================================================================*/
function search2(usrstr, jsonFile){
  var arr1 = [], arr2 = [];
  var searchText = stripStr(usrstr);
  var permutations = getAllPermutations(searchText.split(" "));
  /* Search by icd10 */
  var s1 = searchICD10(searchText, jsonFile);
  if(s1) arr1.push(s1);
  /* Search Json data with all permutations */
  for (var i=0; i<permutations.length; i++){
    var s2 = searchDesc(permutations[i], jsonFile);
    if(s2) arr1.push(s2);
  }
  /* Combine all Arrays into one unique array */
  if(arr1.length == 1) arr2.push(arr1.pop());
  else{
    for(var i=0; i<arr1.length-1;i++){
      arr2.push(joinArrayUnique(arr1[i].concat(arr1[i+1])));
    }
  }
  return arr2.pop();
};
