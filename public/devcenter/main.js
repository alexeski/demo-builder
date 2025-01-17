

const VERSION="1.02";
const DEFAULT_SETTINGS="default";
const NO_FILTER_TEXT = 'Activate View at Least Once to Setup...';
const WARNTABS="This workbook has hidden tabs, switching views and keeping filter state could not be possible ! Consider changing to \'Tabbed Views\'."
var currentTemplate;
var crossMessageHandler;
var magicGrid;
var pickers=[];
var panelSet;
var viewsModified=false;
var curSearch;
var curSearchVarC; 
var isTemplateLoaded;
var friendlyTpName={"templates/grid/index.html":"Horizontal",
                    "templates/gridV/index.html":"Vertical",
                    "templates/bs/index.html":"BootStrap",
                    "templates/gridstack/index.html":"Widgets",
                    "templates/marketplace/index.html":"Market_Place"
                  }
//WORK-AROUND FOR VIZ BEING IN IFRAME
Window.prototype._addEventListener = Window.prototype.addEventListener;
Window.prototype.addEventListener = function(a, b, c) {
   if(a==="message"){
    crossMessageHandler=b;
   }
   if (c==undefined) c=false;
   this._addEventListener(a,b,c);
   if (! this.eventListenerList) this.eventListenerList = {};
   if (! this.eventListenerList[a]) this.eventListenerList[a] = [];
   this.eventListenerList[a].push({listener:b,options:c});
};

function addNewIframeListener(){
  for(let i=0;i<$("iframe").length;i++){
    $("iframe")[i].contentWindow.addEventListener('message', crossMessageHandler, true);
  }
}
async function init(){
  $(".tdropdown").addClass("active");
  $(".tdropsub").show();
  $("#file").on("change", function (event){
    var files = this.files;
    restoreFromFile(files);
  })
  window.onresize = function(e){
    var marg=$("body").height()-642;
    if(isTableauPublic()==true)
      marg=$("body").height()-460;
    else
      marg=$("body").height()-696;  
    if(marg<316)
      marg=316;
    $(".tb").css("max-height",marg);
  };
  $(".sidebar-dropdown.tdropdown > a").click(function () {
    $(".sidebar-submenu:not(.tdropsub)").slideUp(150);
    setTimeout(() => {
      if ($(this).parent().hasClass("active")) {
        $(this).parent().removeClass("active");
        $(".sidebar-submenu.tdropsub").slideUp(150);
      } else {
        $(this).next(".sidebar-submenu").slideDown(200);
        $(this).parent().addClass("active");
        $(".sidebar-submenu .thumb.templ").css("display","flex");
        $(".sidebar-submenu details").css("display","block");
        $(".sidebar-submenu details summary").css("display","list-item");
        $(".sidebar-dropdown:not(.tdropdown)").removeClass("active");
      }
    }, 150);
  })
  $(".sidebar-dropdown:not(.tdropdown) > a").click(function () {
    $(".sidebar-submenu:not(.tdropsub)").slideUp(150);
    $(".sidebar-submenu.tdropsub").slideDown(200);
    setTimeout(() => {
      $(".sidebar-submenu .thumb.templ:not(.active)").css("display","none");
      $(".sidebar-submenu details").css("display","none");
      $(".sidebar-submenu details[open]:has(> .active)").css("display","block");
      $(".sidebar-submenu details[open]:has(> .active) summary").css("display","none");
      $(".sidebar-submenu.tdropsub").addClass("active");
      if ($(this).parent().hasClass("active")) {
        $(this).parent().removeClass("active");
      } else {
        $(".sidebar-dropdown").removeClass("active");
        $(this).next(".sidebar-submenu").slideDown(200);
        $(this).parent().addClass("active");
        if($(this).parent().hasClass("vdropdown")){
          var ev=new Event('resize');
          ev.fake=true;
          window.dispatchEvent(ev);
        }

      }
    }, 150);
  });
  $("#close-sidebar .fa-bars").click(function () {
    $(".page-wrapper").removeClass("toggled");
  });
  $("#show-sidebar").click(function () {
    $(".page-wrapper").addClass("toggled");
  });
  if(localStorage.getItem("VERSION")!=VERSION){
    var r=await restoreFromUrl(DEFAULT_SETTINGS,false);
  }
  initModal();
  if(localStorage.getItem("WARN")==null){
    showModal("modal-warn");
  }
    
  if(checkSettings()==true){
    $(".init").show();
    $(".tabpub input").prop("checked",false);
    getProjects();
  }
  else{
    //splash here
    showSettings();
    $(".tdropdown").show();
    $(".tabpub").show();
    $(".vdropdown").show();
    $(".sidebar-search").show();
    $(".tabpub input").prop("checked",true);
  }
  currentTemplate="templates/grid/index.html";  
  //switchTemplate(currentTemplate);
  restoreViz();
  initHelpVideo();
}
function initHelpVideo(){
  $("[data-media]").on("click", function(e) {
    e.preventDefault();
    var $this = $(this);
    var videoUrl = $this.attr("data-media");
    var $popupIframe = $(".popup").find("iframe");
    $popupIframe.attr("src", videoUrl);
    $("body").addClass("show-popup");
  });

  $(".popup").on("click", function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      $("body").removeClass("show-popup");
  });

  $(".popup > iframe").on("click", function(e) {
      e.stopPropagation();
  });
}
function closeWarn(){
  MicroModal.close('modal-warn'); 
  localStorage.setItem("WARN","agree");
  window.location.reload();
}
function highlightElementbyCSSColor(color) {
  var elms = document.getElementById('template').contentWindow.document.querySelectorAll("*");
  Array.prototype.forEach.call(elms, function(elm) {
    var clr = elm.style.color || "";
    clr = clr.replace(/\s/g, "").toLowerCase();
    console.log(getComputedStyle(elm).color)
  });
}
function checkSettings(){
  return localStorage.getItem("SERVER_URL")!="" && localStorage.getItem("SITE_NAME") !="" 
    && localStorage.getItem("TOKEN_NAME")!=""  && localStorage.getItem("TOKEN_VALUE")!=""
    && localStorage.getItem("SERVER_URL")!=null && localStorage.getItem("SITE_NAME") !=null
    && localStorage.getItem("TOKEN_NAME")!=null  && localStorage.getItem("TOKEN_VALUE")!=null
}
function initModal(){
  MicroModal.init({
    openTrigger: "data-custom-open", 
    closeTrigger: "data-custom-close", 
    disableScroll: true,
    disableFocus: false, 
    awaitCloseAnimation: true, 
    awaitOpenAnimation: true, 
    debugMode: false
  });
}
function dropFile(e) {
    $(this).removeClass('dragging');
    e.preventDefault();  
    e.stopPropagation();
    var dt = e.dataTransfer || (e.originalEvent && e.originalEvent.dataTransfer);
    var files = e.target.files || (dt && dt.files);
    restoreFromFile(files);
};
function showModal(id){
  MicroModal.show(id,{onClose:()=>{
    $("#template").contents().find("iframe").fadeIn(200);
  }});
}
function openViewsPanel(){
  $(".sidebar-dropdown").removeClass("active");
  $(".pdropsub").slideUp(200);
  $(".vdropdown").addClass("active");
  $(".vdropsub").slideDown(200);
}
function clearItems(){
  $(".tb").empty();
  $(".vnum").text("");
  $(".pnum").text("");
  $(".projects").empty();

}
function giveMeSalt(token){
  return new Promise((resolve,reject)=>{
    var formBody = formize({token:token})
    fetch("/salt", {
      method: "POST", 
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody
    }).then(res => {
      var js=res.json();
      return js;
    }).then((data) => {
      resolve(data.salted)
    });
  })
}
async function saveSettings(){
  var tksalt=await giveMeSalt($("#tokValue").val());
  localStorage.setItem("SERVER_URL",$("#servurl").val());
  localStorage.setItem("SITE_NAME",$("#siteName").val());
  localStorage.setItem("TOKEN_NAME",$("#tokName").val());
  localStorage.setItem("TOKEN_VALUE",tksalt);
  localStorage.setItem("VERSION",VERSION);
  $(".tabpub input").prop("checked",false);
  if(checkSettings()==true && !isTableauPublic()){
    closeAllMenu();
    clearItems();
    $(".init").show();
    $(".tdropdown").addClass("active");
    $(".tdropsub").show();
    getProjects();
  }  
  else{
    togglePublic();
  }
  MicroModal.close('modal-settings'); 
}
function showSettings(){
  $("#template").contents().find("iframe").fadeOut(200);
  $("#servurl").val(localStorage.getItem("SERVER_URL"))
  $("#siteName").val(localStorage.getItem("SITE_NAME"))
  $("#tokName").val(localStorage.getItem("TOKEN_NAME"))
  $("#tokValue").val(localStorage.getItem("TOKEN_VALUE"))
  showModal("modal-settings")
  $(".gogo").focus();
}
function saveToFile(name){
  var text=JSON.stringify(localStorage);
  text=text.replaceAll('\\"',"'");
  var blob = new Blob([text], {type: "text/plain;charset=utf-8"});
  var d = new Date();
  var datestring = ("0" + d.getDate()).slice(-2) + "-" + ("0"+(d.getMonth()+1)).slice(-2) + "-" +
  d.getFullYear() + "--" + ("0" + d.getHours()).slice(-2) + "h" + ("0" + d.getMinutes()).slice(-2);
  if(name)
    saveAs(blob, name.replaceAll(".zip","").replaceAll(".txt","")+".txt");
  else
    saveAs(blob, "myConfig_"+datestring+".txt");
}
function reloadMe(nodelay=false){
  var start=4;
  $(".text_drop").css("color","#4d5ee0");
  $(".text_drop").css("font-weight","bolder");
  $(".text_drop").text(`Page will reload in ${start} seconds !`);
  setInterval(() => {
    start=start-1;
    $(".text_drop").text(`Page will reload in ${start} second${start>1?"s !":"  !"}`);
  }, 1000);
  setTimeout(() => {
    window.location.reload();
  }, nodelay==true?100:4100);
}
function restoreFromUrl(url,reload=true){
  return new Promise((resolve,reject)=>{
    fetch(url+'.txt')
    .then((response) => {
      return response.json();
    }).then((data) => {
      localStorage.clear();
      localStorage.setItem("VERSION",VERSION);
      for (var name in data) {
          localStorage.setItem(name, data[name] );
      }
      if(reload==true)
        reloadMe(); 
      resolve();
    });
  })
}
function restoreFromFile(files) {
  for (var i = 0, f; f = files[i]; i++) {
      var fr=new FileReader();
      fr.onload = function(e) {
          try {
            var cur=e.target.result.replaceAll(",\r\n",",");
            //cur=cur.replaceAll("'",'"');
            // cur=cur.replaceAll("['",'["');
            // cur=cur.replaceAll("']",'"]');
            // cur=cur.replaceAll(",'",',"');
            // cur=cur.replaceAll("',",'",');
            var storage = JSON.parse(cur);
          }catch(err){
            alert("File content is wrong..." +err);
            return;
          }
          localStorage.clear();
          for (var name in storage) {
              if(storage[name] instanceof Object) {
                localStorage.setItem(name, JSON.stringify(storage[name]) );
              } else {
                localStorage.setItem(name,storage[name] );
              }      
          }
          localStorage.setItem("VERSION",VERSION);
      };
      fr.readAsText(f);
      reloadMe();
  }
};
function getProjects(){
  var details=getData();
  var formBody = formize(details)
  fetch("/projects", {
  //  fetch("http://localhost:3000/projects", {  
    method: "POST", 
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formBody
  }).then(res => {
    var js=res.json();
    return js;
  }).then((data) => {
    populateProjects(data);
  });
}
function getWorkbooks(projName){
  var details=getData();
  details.project=projName;
  var formBody = formize(details)
  fetch("/workbooks", {
  // fetch("http://localhost:3000/workbooks", {  
    method: "POST", 
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formBody
  }).then(res => {
    var js=res.json();
    return js;
  }).then((data) => {
    populateWorkbook(data);
  });
}
function getViews(projName,warn){
  var details=getData();
  details.project=projName;
  var formBody = formize(details)
  fetch("/list", {
    // fetch("http://localhost:3000/list", {  
    method: "POST", 
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formBody
  }).then(res => {
    var js=res.json();
    return js;
  }).then((data) => {
    populateViews(data,false,warn);
  });
}
function getData(){
  var data = {
    'host': localStorage.getItem("SERVER_URL"),
    'site': localStorage.getItem("SITE_NAME"),
    'tokenName': localStorage.getItem("TOKEN_NAME"),
    'tokenValue': localStorage.getItem("TOKEN_VALUE")
  };
  return data;
}
function formize(details){
  var formBody = [];
  for (var property in details) {
    var encodedKey = encodeURIComponent(property);
    var encodedValue = encodeURIComponent(details[property]);
    formBody.push(encodedKey + "=" + encodedValue);
  }
  formBody = formBody.join("&");
  return formBody
}
function chrono(num,el,big){
  return new Promise((resolve,reject)=>{
    setTimeout(() => {
      el.text(num)
      resolve(num);
    }, big==true?2:100);
  })
}
async function populateWorkbook(data){
  $(".twb").empty();
  $(".tb").empty();
  $(".twb").show();
  $(".loadwb").hide();
  if(data.message){
    $(".twb").append(
      `<div class="thumb"> 
          <div class="thumb_text err">${data.message}</div>
      </div>`
    );
    return;
  }
  $(".wbnum").css("background-color","#28a745");
  rawvNum=data.length;
  for(var i = 0; i < data.length; i++) {
    await chrono(i+1,$(".wbnum"),data.length>30);
    var obj = data[i];
    $(".twb").append(
      `<div title="${obj.name}" id="${obj.id}" class="thumb wkb" onclick="showViews('${obj.id}',this,${obj.showTabs=== 'false'})">
      <div class="nosel thumb_text">${titleCase(obj.name)}</div>
          <i class="check fa fa-check"></i> 
      </div>`
    );
  }
  $(".wbnum").css("background-color","");
  if(data.length>0){
    var ww=data[0].showTabs=== 'false';
    showViews(data[0].id,$(`#${data[0].id}`),ww);
  }

}
async function populateViews(data,ispublic=false,warn){
  if(ispublic==false){
    $(".tb").empty();
    $(".tb").show();
  }
  $(".loadview").hide();
  if(data.message){
    $(".tb").append(
      `<div class="thumb"> 
          <div class="thumb_text err">${data.message}</div>
      </div>`
    );
    return;
  }
  $(".vnum").css("background-color","#28a745");
  rawvNum=data.length;
  for(var i = 0; i < data.length; i++) {
    if(ispublic==false)
      await chrono(i+1,$(".vnum"),data.length>30);
    var obj = data[i];
    $(".tb").append(
      `<div class="thumb vie"> 
          <div title="${obj.name}" class="nosel thumb_text">${obj.name}</div>
          <img onload="successImage(this)" onerror="retryImage(this)" id="${obj.link}#!${obj.name}#!${obj.url}#!${warn}"" draggable="true" ondragstart="drag(event)" ondragend="dropEnd(event)" class="thumb_pic" src="${obj.url}" />
      </div>`
    );
  }
  $(".vnum").css("background-color","")
}
async function populateProjects(data){
  $(".projects").empty();
  $(".loadp").hide();
  if(data.message){
    $(".projects").append(
      `<div class="thumb"> 
          <div class="thumb_text err">${data.message}</div>
      </div>`
    );
    $(".pdropdown").addClass("active");
    $(".pdropsub").show();
    $(".pdropdown .badge").addClass("badge-danger");
    $(".pnum").text("!");
    return;
  }
  $(".pdropdown .badge").removeClass("badge-danger");
  $(".pnum").css("background-color","#28a745");
  rawpNum=data.length;
  for(var i = 0; i < data.length; i++) {
    await chrono(i+1,$(".pnum"));
    var obj = data[i];
    $(".projects").scrollTop(0);
    $(".projects").append(
      `<div title="${obj.name}" id="${obj.id}" class="thumb proj" onclick="showWorkbook('${obj.name}',this)">
          <div class="nosel thumb_text">${titleCase(obj.name)}</div>
          <i class="check fa fa-check"></i> 
      </div>`
    );
  }
  $(".pnum").css("background-color","");
  showWorkbook(data[0].name,$(`#${data[0].id}`));
  $(".wbdropdown").removeClass("active");
  $(".wbropsub").hide();
  $(".vdropdown").removeClass("active");
  $(".vdropsub").hide();
}

function successImage(image){
  image.style.display="inline-block";
}
function retryImage(image){
  if (!image.hasOwnProperty('retryCount')){
    image.retryCount = 0;
  }
  image.style.display="none"
  if (image.retryCount < 20){
    setTimeout(function (){
        image.src += '?'+ image.retryCount;
        image.retryCount += 1;
    }, 2000);
  }
  else{
    image.style.display="inline-block";
  }
}
function closeAllMenu(){
  $(".sidebar-dropdown").removeClass("active");
  $(".sidebar-submenu").hide();
}
function switchTemplate(tpName,ev){
  $("#template").prop("src",tpName);
  currentTemplate=tpName;
  disposeAllViz();
  if(ev)
    closeSettings();
  $("#container").empty();
  clearInterval(isTemplateLoaded);
  restoreViz();
  if(ev){
    $(".thumb.templ").removeClass("active");
    $(ev).addClass("active");
    $(".sidebar-menu .sidebar-submenu details .fas").hide();
    $(ev).find("i").show();
  }
}
function showViews(vname,ev,warn){
  $(".thumb.wkb").removeClass("active");
  $(".vnum").text("");
  $(".loadview").show();
  $(ev).addClass("active");
  $(".tb").scrollTop(0);
  getViews(vname,warn);
}
function showWorkbook(vname,ev){
  $(".vnum").text("");
  $(".loadview").show();
  $(".thumb.proj").removeClass("active");
  $(".wbnum").text("");
  $(".loadwb").show();
  $(ev).addClass("active");
  $(".twb").scrollTop(0);
  getWorkbooks(vname);
}
function allowDrop(ev) {
  ev.preventDefault();
}
function drag(ev) {
  ev.dataTransfer.setData("text", ev.target.id);
  $("#template").contents().find("iframe").fadeOut(200);
}
function getDataSource(activeSheet){
  activeSheet.getUnderlyingTablesAsync().then((dt)=>{
    options = {
      maxRows: 0, 
      ignoreAliases: false,
      ignoreSelection: true,
      includeAllColumns: false
      };
    activeSheet.getUnderlyingTableDataAsync(dt[0].getTableId(), options).then((tb)=>{
      console.log(tb.getData(),tb.getColumns());
    })
  })
}
function dropEnd(){
  $("#template").contents().find("iframe").fadeIn(200);
}
function disposeFilters(vizid){
  $("div").remove(`div [vizf='${vizid}']`)
}
function disposeAllViz(){
  tableau.VizManager.getVizs().map((vz)=>{
    vz.dispose();
    disposeFilters(vz.vizid);
    console.log("Disposing",vz.vizid,"for",vz.template);
  })
}
function drop(ev) {
  var notauth=false;
  ev.preventDefault();
  var indx=$(ev.currentTarget).attr("varindex");
  var data = ev.dataTransfer.getData("text");
  clearAView(indx);
  var ur=trimURL(getCurrentServerInfo().host)+"/t/"+getCurrentServerInfo().site+"/views/"+data.split("#!")[0].replace("/sheets","");
  if(isTableauPublic()==true)
    ur=data.split("#!")[2];
  if(isTableauPublic()==true)
    $(ev.currentTarget).attr("value",data.split("#!")[0]);
  else
    $(ev.currentTarget).attr("value",ur);
  $(ev.currentTarget).find("img").on("load",()=>{
    var cp=$(".wload[varindex='"+indx+"']")[0].complete;
    $(".wload[varindex='"+indx+"']").css("filter",'blur(0px)')
  })
  $(ev.currentTarget).find("img").on("error",()=>{
    $(".wload[varindex='"+indx+"']").prop("src","/notauth.png");
    $(".wload[varindex='"+indx+"']").css("filter",'blur(0px)')
  })
  $(ev.currentTarget).find("img").css("filter",'blur(5px)');
  if(isTableauPublic()==true)
    $(ev.currentTarget).find("img").prop("src",ur);
  else
    $(ev.currentTarget).find("img").prop("src",ur+".png");
  initFilterRepo();
  var ff=JSON.parse(getRepoVal("filter","filter").replaceAll("'",'"'));
  ff[parseInt(indx)]=[];
  saveToRepo('filter','filter',JSON.stringify(ff));
  saveTemplateSettings();
  $(`.filtertcont${indx}`).html(`<i varindex="${indx}" title="Refresh Filter List" onclick="refreshFilters(event,'${indx}')" class="refreshFilterIcon fas fa-sync-alt"></i>`)
  setTimeout(() => {
    refreshFilters(null,parseInt(indx));
  }, 4000);
  $(`.deleteViewCont[varindex='${indx}']`).show();
  if(data.split("#!")[3]!='undefined' && data.split("#!")[3]=='true'){
    $(`.warningCont[varindex='${indx}']`).show();
  }
  $(`input.viewName[varindex='${indx}']`).prop("value",data.split("#!")[1]);
}
function storeViz(templateName,vizID,vizURL){
  var cur=localStorage.getItem(templateName)==null?{vizzes:[]}:JSON.parse(localStorage.getItem(templateName));
  var idf=-1;
  cur.vizzes.map((el,id)=>{
    if(el.vizID==vizID)
      idf=id;
  })
  if(idf!=-1)
    cur.vizzes[idf]={vizID:vizID,vizURL:vizURL};
  else
    cur.vizzes.push({vizID:vizID,vizURL:vizURL});

  localStorage.setItem(templateName,JSON.stringify(cur))
}
function initPicker(id,col){
  $('#'+id).css("color",contrastFontColor(col)); 
  var p=Pickr.create({
    el: '#'+id,
    theme: 'nano',
    useAsButton: true,
    default: col,
    showAlways:true,
    i18n: {
      'btn:save': 'OK'
    },
    swatches: [
      'rgba(244, 67, 54, 1)',
      'rgba(0, 165, 81, 1)',
      'rgba(233, 30, 99, 0.95)',
      'rgba(156, 39, 176, 0.9)',
      'rgba(103, 58, 183, 0.85)',
      'rgba(63, 81, 181, 0.8)',
      'rgba(33, 150, 243, 0.75)',
      'rgba(3, 169, 244, 0.7)',
      'rgba(0, 188, 212, 0.7)',
      'rgba(0, 150, 136, 0.75)',
      'rgba(76, 175, 80, 0.8)',
      'rgba(76, 175, 80, 0.8)',
      'rgba(205, 220, 57, 0.9)',
      'rgba(255, 235, 59, 0.95)',
      'rgba(255, 193, 7, 1)'
    ],
    components: {
        preview: true,
        opacity: true,
        hue: true,
        interaction: {
            input: true,
            cancel: true,
            save: true
        }
    }
  }).on('save', color => {
    $('#'+id).css("background-color",color.toRGBA().toString(0)); 
    $('#'+id).css("color",contrastFontColor(color.toHEXA().toString(0))); 
    $('#'+id).prop("value",color.toHEXA().toString(0));
    p.hide();
  }).on('init', instance => {
    instance.hide();
  }).on('cancel', color => {
    p.hide();
  })
  $('#'+id).on('focus',(ev)=>{
    var oneOpened=false
    pickers.forEach(el =>{
      if(el.picker.isOpen()==true){
        $('#'+el.id).css("background-color",el.picker.getColor().toRGBA().toString(0)); 
        $('#'+el.id).css("color",contrastFontColor(el.picker.getColor().toHEXA().toString(0))); 
        $('#'+el.id).prop("value",el.picker.getColor().toHEXA().toString(0));
        el.picker.hide();
      }
    })  
      p.show();
  })
  $('#'+id).on('change',(ev)=>{
    var newcolor=$(ev.currentTarget).val();
    $(ev.currentTarget).css("background-color",newcolor); 
    $(ev.currentTarget).css("color",contrastFontColor(newcolor)); 
    p.setColor(newcolor);
  })
  pickers.push({id:id,picker:p});

}
function collapseDetailsPanelAuto(){
  $('details.top').click(function (event) {
    $('details.top').not(this).removeAttr("open");  
  });
  $('details.scn').click(function (event) {
    $('details.scn').not(this).removeAttr("open");  
  });
}
function getRepoVal(type,key){
  return localStorage.getItem(type+'---'+currentTemplate+'-'+key);
}
function checkRepoKeyExist(type,key){
  return localStorage.getItem(type+'---'+currentTemplate+'-'+key)!=null && typeof(localStorage.getItem(type+'---'+currentTemplate+'-'+key))!='undefined';
}
function saveToRepo(type,key,value){
  localStorage.setItem(type+'---'+currentTemplate+'-'+ key,value)
}
function parseForCSSVar(docu){
  var allCSS = [];
  [].slice.call(docu.styleSheets)
  // .filter((styleSheet)=>{
  //   !styleSheet.href || styleSheet.href.startsWith(window.location.origin)
  // })
  .reduce(function(prev, styleSheet) {
    try{
      if (styleSheet.cssRules) {
        return prev + [].slice.call(styleSheet.cssRules)
          .reduce(function(prev, cssRule) {        
            if (cssRule.selectorText == ':root') {
              var css = cssRule.cssText.split('{');
              css = css[1].replace('}','').split(';');
              for (var i = 0; i < css.length; i++) {
                var prop = css[i].split(':');
                if (prop.length == 2 && prop[0].indexOf('--') == 1 ) {
                  var key=prop[0].replaceAll(" ","");
                  var val=prop[1].replaceAll(" ","")
                  if(checkRepoKeyExist('color',key)){
                    allCSS.push({variable:key,value:getRepoVal('color',key)})
                  }else{
                    allCSS.push({variable:key,value:val})
                  }         
                }              
              }
            }
          }, '');
      }
  } 
  catch(e){

  }
}
  , '');
  return allCSS;
}
function parseForFilters(win,index){
  //INDEX !!
  if(win.tab_all_filters){
    if(win.tab_all_filters[index] && win.tab_all_filters[index].viz){
      if(checkRepoKeyExist("filter","filter")){
        win.tab_all_filters[index].filters.map((el)=>{
          el.isChecked=false;
          win.tab_filter[index].map((rep)=>{
            if(el.getFieldName()==rep){
              el.isChecked=true;
            }
          })
        })
      }
      return win.tab_all_filters[index];
    }
    else{
      return null;
    }
  }
  else{
    alert("this template has no 'tab_all_filters' global variable");
    return null;
  }
 
}
function parseForParameters(win,index){
  if(win.tab_all_params){
    if(win.tab_all_params[index] && win.tab_all_params[index].viz){
      if(checkRepoKeyExist("parameter","parameter")){
        win.tab_all_params[index].parameters.map((el)=>{
          el.isChecked=false;
          win.tab_param[index].map((rep)=>{
            if(el.getName()==rep){
              el.isChecked=true;
            }
          })
        })
      }
      return win.tab_all_params[index];
    }
    else{
      return null;
    }
  }
  else{
    alert("this template has no 'tab_all_params' global variable");
    return null;
  }
 
}
function parseForViews(win){
  if(win.tab_server){
    if(checkRepoKeyExist("view","view")){
      return getRepoVal("view","view").split(',');
    }
    else
      return win.tab_server;
  }
  else{
    alert("this template has no 'tab_server' global variable");
    return null;
  }
}
function parseForText(docu){
  var texts=[]
  const childNodes = docu.getElementsByClassName("editable");
  for (let i = 0; i < childNodes.length; i++) {
    if(!$(childNodes[i]).is("script")){
      var tt=$(childNodes[i]).clone().children().remove().end()
      var text=tt[0].innerHTML.trim().replaceAll("\"","'").split("\n")[0]+" ";
      if(text!=""){
        if(checkRepoKeyExist('text',childNodes[i].id)){
          texts.push({variable:childNodes[i].id,text:getRepoVal('text',childNodes[i].id)})
        }else{
          texts.push({variable:childNodes[i].id,text:text})
        }  
      }
    }
  }
  return texts;
}
function parseForImage(docu){
  var imgs=[]
  const childNodes = docu.getElementsByClassName("img-editable");
  for (let i = 0; i < childNodes.length; i++) {
      var el=$(childNodes[i]);
      if(typeof(el.prop("src"))!='undefined' && el.prop("src")!=""){
        if(checkRepoKeyExist('img',el.prop("src"))){
          imgs.push({variable:childNodes[i].id,text:getRepoVal('img',el.prop("src"))})
        }else{
          imgs.push({variable:el.prop("id"),img:el.prop("src")})
        }  
      }
  }
  return imgs;
}
function getMaxLoadedPage(){
  var mx=0;
  $(".searchres").each((id,element) => {
    var p=$(element).attr("page");
    mx=Math.max(mx,parseInt(p)); 
  });
  return mx;
}
function isAllPageLoaded(){
  return getMaxLoadedPage()==getMinAllPages();
}
function getMinAllPages(){
  var mx=100000;
  $(".searchres").each((id,element) => {
    var p=$(element).attr("pages");
    mx=Math.min(mx,parseInt(p)); 
  });
  return mx;
}
function addSearchListener(){
  $("#modal-pict-content").on('scroll', function (e) {
    var sc=$("#modal-pict-content").scrollTop();
    var ms=$("#modal-pict-content").prop("scrollHeight");
    if(sc==(ms-$("#modal-pict-content").height()) && (getMaxLoadedPage() +1)<=getMinAllPages()){
        fetch('/pict?page='+(getMaxLoadedPage() +1)+'&search='+curSearch)
        .then( res => res.text() )
        .then( (tx) => {
          $("#modal-pict-content").append(tx);
          $(".searchres").attr("varc",curSearchVarC)
          $(".searchres").on('click',(e)=>{
            $(".searchres").removeClass("selected")
            $(e.currentTarget).addClass("selected");
          })
        });
    }
  })
  $(".searchpict").on('keyup', function (e) {
    if (e.key === 'Enter' || e.keyCode === 13) {
      curSearch=encodeURIComponent($(e.currentTarget).val());
      curSearchVarC=$(e.currentTarget).attr("varc");
      $("#modal-pict-content").empty();
      maxp=1;
      showModal('modal-pict');
      fetch('/pict?search='+encodeURIComponent($(e.currentTarget).val()))
      .then( res => res.text() )
      .then( (tx) => {
        $("#modal-pict-content").empty();
        $("#modal-pict-content").append(tx);
        $(".searchres").attr("varc",$(e.currentTarget).attr("varc"))
        $(".searchres").on('click',(e)=>{
          $(".searchres").removeClass("selected")
          $(e.currentTarget).addClass("selected");
        })
      });
    }
  });
}
function refreshFilters(ev,id){
  if(ev){
    ev.stopPropagation();
    ev.preventDefault();
  }
  document.getElementById('template').contentWindow.loadVizByIndex(parseInt(id));
  $(`.refreshFilterIcon[varindex='${id}']`).addClass('spin');
  setTimeout(() => {
    var ct="";
    ct+=getParamDom(id);
    ct+=getFilterDom(id,ct);
    $(`.filtertcont${id}`).html(ct);
    $(`.refreshFilterIcon[varindex='${id}']`).removeClass('spin');
    $(`.refreshFilterIcon[varindex='${id}']`).hide();;
  }, 10000);
}
function getFilterDom(id,nodeParam,el){
  var nodeFilter=""
  var cur_filter=parseForFilters(document.getElementById('template').contentWindow,id);
    if(nodeParam=="" && cur_filter==null)
      nodeFilter=`<i varindex="${id}" style="${el==""?"display:none":""}" title="Refresh Filter List" onclick="refreshFilters(event,'${id}')" class="refreshFilterIcon fas fa-sync-alt"></i>`;
    if(cur_filter!=null){
      cur_filter.filters.map((fl)=>{
        if(fl.getFilterType()=='categorical' && fl.getFieldName().indexOf("Action (")==-1 && fl.getFieldName().indexOf("Measure Names")==-1){
          var repT=getRepoVal('text',"Filter-text-"+fl.getFieldName());
          var ttx=repT!=null?repT:fl.getFieldName();
          var filInput=`<input varindex="${id}" dumid="${fl.getFieldName().replace(/[^a-z0-9+]+/gi, '_')}" varc="${fl.getFieldName()}" class="filterText ${fl.isChecked==true?"":"hideFilterInput"} texts input input_settings" required="true" value="${decodeURIComponent(ttx)}"></input>`
          nodeFilter+=`<li class="filter${id}">
                        <input onchange="$('.filterText[dumid=${fl.getFieldName().replace(/[^a-z0-9+]+/gi, '_')}]').toggle('hideFilterInput')" class="filter-entry" varindex="${id}" varc="${fl.getFieldName()}" type="checkbox" ${fl.isChecked==true?"checked":""}> 
                        ${fl.getFieldName()} (${fl.getWorksheet().getName()})
                        ${filInput}
                        </li>`
        }
      })
    }
    return nodeFilter;
}
function getParamDom(id){
  var nodeParam="";
  var cur_params=parseForParameters(document.getElementById('template').contentWindow,id);
    if(cur_params!=null){
      cur_params.parameters.map((par)=>{
        if(par.getAllowableValuesType()=='list'){
          var repT=getRepoVal('text',"Filter-text-"+par.getName());
          var ttx=repT!=null?repT:par.getName();
          var parInput=`<input varindex="${id}" dumid="${par.getName().replace(/[^a-z0-9+]+/gi, '_')}" varc="${par.getName()}" class="filterText ${par.isChecked==true?"":"hideFilterInput"} texts input input_settings" required="true" value="${decodeURIComponent(ttx)}"></input>`
          nodeParam+=`<div class="filter${id}">
                        <li onchange="$('.filterText[dumid=${par.getName().replace(/[^a-z0-9+]+/gi, '_')}]').toggle('hideFilterInput')" class="param${id}">
                          <input class="param-entry" varindex="${id}" varc="${par.getName()}" type="checkbox" ${par.isChecked==true?"checked":""}> ${par.getName()} (Parameter)
                        </li>
                      ${parInput}
                      </div>`
        }
      })
    }
  return nodeParam;  
}
function reconstructPublicViewThumb(url){
  var ret;
  ret=url.split("?")[0];
  var both=ret.split("https://public.tableau.com/views/");
  ret="https://public.tableau.com/static/images/"+both[1].substring(0,2)+"/"+both[1]+"/4_3";
  console.log(ret)
  return ret;
}
function populateViewsSettings(){
  $("#viewlist").empty();
  $("#viewlist").append("<summary>Views Settings</summary>");
  parseForViews(document.getElementById('template').contentWindow).map((el,id)=>{
    var nodefilter=''
    nodefilter+=getParamDom(id);
    $("#viewlist").append(`<details id="view${id}"></details>`);
    nodefilter+=getFilterDom(id,nodefilter,el);
    $(`#view${id}`).append(`<summary>View ${id+1}`);
    var isPublic=el.indexOf("https://public.tableau.com/")!=-1;
    var imgSrc="";
    if(el!=""){
      imgSrc=el+".png";
      if(isPublic)
        imgSrc=reconstructPublicViewThumb(el)+".png";
    }
    else{
      imgSrc="/newView.png";
    }
    var node=`
    <div ondrop="drop(event)" ondragover="allowDrop(event)" varindex="${id}" varc="${el}" value="${el}" class="views vplace">
      <img class="wload" varindex="${id}" height="260px" width="380px" src="${imgSrc}" >
      <div style="${el==""?"display:none":(getRepoVal("warnings",id)=='true'?"":"display:none")}" varindex="${id}" class="warningCont"><i title="${WARNTABS}" class="warning fas fa-exclamation-triangle"></i></div>
      <div style="${el==""?"display:none":""}" varindex="${id}" class="deleteViewCont"><i title="Clear this View" onclick="clearAView('${id}')" class="deleteView fas fa-trash-alt"></i></div>
      </summary>
      <div class="filterboxes">
        <details class="scn" open>
          <summary class="tpb">View Name:</summary>
          <input varindex="${id}" varc="" class="viewName texts input input_settings" value="">
        </details>  
        <details class="scn">
          <summary class="tpb">Filters:</summary>
          <ul class="filtertcont${id}">
            ${nodefilter}
          </ul>
        </details>

        <details class="scn">
          <summary class="tpb">Web Edit:</summary>
          <input class="webedit" varindex="${id}" type="checkbox" ${getRepoVal("webedit",id)=="true"?"checked":""}> <label> Activated</label>
        </details>

        <details class="scn">
          <summary class="tpb">Ask Data:</summary>
          <input class="askdata" varindex="${id}" type="text" placeholder="Type URL Here..." value="${getRepoVal("askdata",id)==""||getRepoVal("askdata",id)==null?"":getRepoVal("askdata",id)}">
        </details>
        
        <details class="scn">
          <summary class="tpb">Actions:</summary>
          <input class="action" varindex="${id}" type="checkbox" ${getRepoVal("action",id)=="true"?"checked":""}> <label> Activated</label>
        </details>

      </div>
    </div>
    `
    $(`#view${id}`).append(node);
    $(`#view${id}`).find("img.wload").on("error",()=>{
      $(".wload[varindex='"+id+"']").prop("src","/notauth.png");
    })
  });
}
function showTemplateSettings(eve){
  eve.stopPropagation()
  if($(panelSet).is(":visible")==true)
    return;
  $(".pcr-app").remove();
  
  createSettingsPanel();
  pickers=[];
  populateViewsSettings();

  $("#imglist").empty();
  $("#imglist").append("<summary>Images Settings</summary>");
  parseForImage(document.getElementById('template').contentWindow.document).map((el)=>{
    var cpLabel=capitalizeIt(el.variable.replace(currentTemplate+'-','').replaceAll("-"," ") );
    var node=`
    <div  class="settings_block pictsettings">
        <i onclick="highlightElement('${el.variable.replace(currentTemplate+'-','')}')" class="fas target fa-bullseye"></i> <label class="label_settings">${cpLabel} </label>
        <div class="picgroup">
          <input varc="${el.variable}" class="imgs input input_settings searchpict" required="true" placeholder="Search for images or paste url below...">
          <input varc="${el.variable}" class="imgs input input_settings sh" required="true" value="${el.img}">
        </div>
    </div>
    `
    $("#imglist").append(node);
  })
  addSearchListener();
  $("#colorlist").empty();
  $("#colorlist").append("<summary>Colour & UI Settings</summary>");
  parseForCSSVar(document.getElementById('template').contentWindow.document).map((el,index)=>{
    //<i onclick="highlightElementbyCSSColor('${el.value}')" class="fas target fa-bullseye"></i>
    var node=`
    <div class="settings_block">
      <label class="label_settings">${el.variable.replaceAll("-"," ")} </label>
      <input varc="${el.variable}" style="background-color:${el.variable.indexOf("--ui")!=-1?"white":el.value};" id="color${index}" class="color input input_settings" required="true" value="${el.value}">
    </div>
    `
    $("#colorlist").append(node);
    if(el.variable.indexOf("--ui")==-1)
      initPicker("color"+index,el.value);
  })
  $("#textlist").empty();
  $("#textlist").append("<summary>Text Settings</summary>");
  parseForText(document.getElementById('template').contentWindow.document).map((el)=>{
    var node=""
    let re = new RegExp(/Viz-([0-9-]+)-text/);
    var findIndex=re.exec(el.variable);
    if(findIndex!=null){
      $(`.viewName[varindex='${parseInt(findIndex[1])-1}']`).prop("value",decodeURIComponent(el.text));
      $(`.viewName[varindex='${parseInt(findIndex[1])-1}']`).attr("varc",el.variable)
    }
    else if(el.variable.indexOf("Filter-text-")==-1){
    node=`
    <div  class="settings_block">
        <i onclick="highlightElement('${el.variable.replace(currentTemplate+'-','')}')" class="fas target fa-bullseye"></i><label class="label_settings">${el.variable.replace(currentTemplate+'-','').replaceAll("-"," ")} </label>
        <input varc="${el.variable}" class="texts input input_settings" required="true" value="${decodeURIComponent(el.text)}">
    </div>
    `
    }
    $("#textlist").append(node);
  })
  collapseDetailsPanelAuto();
}
function initFilterRepo(){
  var ff=JSON.parse(getRepoVal("filter","filter")==null?null:getRepoVal("filter","filter").replaceAll("'",'"'));
  if(ff==null){
    ff=[]
    $("#viewlist .views").each((index,el)=>{ff.push([])});
    saveToRepo('filter','filter',JSON.stringify(ff));
  }
}
function initParamRepo(){
  var ff=JSON.parse(getRepoVal("parameter","parameter")==null?null:getRepoVal("parameter","parameter").replaceAll("'",'"'));
  if(ff==null){
    ff=[]
    $("#viewlist .views").each((index,el)=>{ff.push([])});
    saveToRepo('parameter','parameter',JSON.stringify(ff));
  }
}
function saveTemplateSettings(close){
  initParamRepo()
  var pp=JSON.parse(getRepoVal("parameter","parameter").replaceAll("'",'"'));
  var cc=[];
  $("#viewlist .param-entry").each((index,el)=>{
    if($(el).prop("checked")){
      if(cc[parseInt($(el).attr("varindex"))])
        cc[parseInt($(el).attr("varindex"))].push($(el).attr("varc"));
      else{
        cc[parseInt($(el).attr("varindex"))]=[]
        cc[parseInt($(el).attr("varindex"))].push($(el).attr("varc"));
      }
    }
    if(cc[parseInt($(el).attr("varindex"))])
      pp[parseInt($(el).attr("varindex"))]=cc[parseInt($(el).attr("varindex"))]; 
    else
      pp[parseInt($(el).attr("varindex"))]=[];     
  })
  if(JSON.stringify(pp)!=getRepoVal("parameter","parameter").replaceAll("'",'"'))
    viewsModified=true;
  saveToRepo('parameter','parameter',JSON.stringify(pp));

  initFilterRepo();
  var ff=JSON.parse(getRepoVal("filter","filter").replaceAll("'",'"'));
  var cc=[];
  $("#viewlist .filter-entry").each((index,el)=>{
    if($(el).prop("checked")){
      if(cc[parseInt($(el).attr("varindex"))])
        cc[parseInt($(el).attr("varindex"))].push($(el).attr("varc"));
      else{
        cc[parseInt($(el).attr("varindex"))]=[]
        cc[parseInt($(el).attr("varindex"))].push($(el).attr("varc"));
      }
    }
    if(cc[parseInt($(el).attr("varindex"))])
      ff[parseInt($(el).attr("varindex"))]=cc[parseInt($(el).attr("varindex"))]; 
    else
      ff[parseInt($(el).attr("varindex"))]=[];     
  })
  if(JSON.stringify(ff)!=getRepoVal("filter","filter").replaceAll("'",'"'))
    viewsModified=true;
  saveToRepo('filter','filter',JSON.stringify(ff));
 
  $(".page-content").css("opacity","0.3");
  
  $("#viewlist .warningCont").each((index,el)=>{
      saveToRepo("warnings",index,$(el).is(":visible"));
  })
  $("#viewlist .askdata").each((index,el)=>{
    var ask=$(el).prop("value");
    var same=getRepoVal("askdata",index);
    if(same!=ask)
      viewsModified=true;
    saveToRepo("askdata",index,ask);
  })
  restoreAskData();

  $("#viewlist .webedit").each((index,el)=>{
    var ck=el.checked==true?"true":"false";
    var same=getRepoVal("webedit",index);
    if(same!=ck)
      viewsModified=true;
    saveToRepo("webedit",index,ck);
  })
  restoreWebEdit();

  $("#viewlist .action").each((index,el)=>{
    var ck=el.checked==true?"true":"false";
    var same=getRepoVal("action",index);
    if(same!=ck)
      viewsModified=true;
    saveToRepo("action",index,ck);
  })
  restoreAction();

  var mv=[];
  $("#viewlist .views").each((index,el)=>{
    mv.push($(el).attr("value"));
  })
  saveToRepo('view','view',mv);
  $("#colorlist .color").each((index,el)=>{
    try {
      document.getElementById('template').contentWindow.document.documentElement.style.setProperty($(el).attr("varc"), $(el).prop("value"));
      //document.getElementById('template').contentWindow.document.documentElement.style.setProperty($(el).attr("varc").replace("-bg-","-tx-"), contrastFontColor($(el).prop("value")));
    } catch (error) {
      console.log("err",$(el).attr("varc"), $(el).prop("value"))
    }
    saveToRepo('color',$(el).attr("varc"),$(el).prop("value"));
    restoreColorInIframes({key:$(el).attr("varc"),val:$(el).prop("value")});
  })
  $("#textlist .texts").each((index,el)=>{
    saveToRepo('text',$(el).attr("varc"),encodeURIComponent($(el).prop("value")));
  })
  $("#viewlist .texts:not(.filterText)").each((index,el)=>{
    saveToRepo('text',$(el).attr("varc"),encodeURIComponent($(el).prop("value")));
    restoreTexts();
  })
  $("#viewlist .filterText").each((index,el)=>{
    var ckf=$(el.parentElement).find(`.filter-entry[varc='${$(el).attr("varc")}']`).prop("checked");
    var ckp=$(el.parentElement).find(`.param-entry[varc='${$(el).attr("varc")}']`).prop("checked");
    if(ckf==true || ckp==true){
      saveToRepo('text',"Filter-text-"+ $(el).attr("varc"),encodeURIComponent($(el).prop("value")));
      restoreTexts();
    }
  })
  $("#imglist .imgs").each((index,el)=>{
    saveToRepo('img',$(el).attr("varc"),$(el).prop("value"));
    restoreImgs();
  })
  if(close){
    closeSettings();
  }
  if(viewsModified==true){
    //restoreViews();
    switchTemplate(currentTemplate);
    viewsModified=false;
  }else{
    $(".page-content").css("opacity","1");
  }
}
function clearAView(viewIndex){
  var arrv=parseForViews(document.getElementById('template').contentWindow);
  arrv[viewIndex]="";
  $(`.filtertcont${viewIndex} *:not('.refreshFilterIcon')`).remove();
  //$(`.filtertcont${viewIndex}`).text(NO_FILTER_TEXT);
  $(`.webedit[varindex='${viewIndex}']`).prop("checked",false);
  $(`.action[varindex='${viewIndex}']`).prop("checked",false);
  $(`.askdata[varindex='${viewIndex}']`).prop("value","");
  $(`.viewName[varindex='${viewIndex}']`).prop("value","Viz "+ (parseInt(viewIndex) +1));
  $(`.vplace[varindex='${viewIndex}']`).attr("value","");
  $(`.vplace[varindex='${viewIndex}']`).attr("varc","");
  $(`.wload[varindex='${viewIndex}']`).prop("src","/newView.png");
  $(`.deleteViewCont[varindex='${viewIndex}']`).hide();
  $(`.refreshFilterIcon[varindex='${viewIndex}']`).hide();
  viewsModified=true;
}
function restoreAction(){
  var w=getStorageByType("action");
  if(w){
    w.map((el)=>{
      document.getElementById('template').contentWindow.tab_action[parseInt(el.key)]=el;
    })
  }
}
function restoreWebEdit(){
  var w=getStorageByType("webedit");
  if(w){
    w.map((el)=>{
      document.getElementById('template').contentWindow.tab_web[parseInt(el.key)]=el;
    })
  }
}
function restoreAskData(){
  var w=getStorageByType("askdata");
  if(w){
    w.map((el)=>{
      document.getElementById('template').contentWindow.tab_ask[parseInt(el.key)]=el;
    })
  }
}
function restoreParameters(){
  var f=getStorageByType("parameter");
  if (f && f[0] && JSON.parse(f[0].val.replaceAll("'",'"')).length>0){
    document.getElementById('template').contentWindow.tab_param=JSON.parse(f[0].val.replaceAll("'",'"'));
  }
}
function restoreFilters(){
  var f=getStorageByType("filter");
  if (f && f[0] && JSON.parse(f[0].val.replaceAll("'",'"')).length>0){
    document.getElementById('template').contentWindow.tab_filter=JSON.parse(f[0].val.replaceAll("'",'"'));
  }
}
function restoreColorInIframes(el){
  var selection = document.getElementById('template').contentWindow.document.getElementsByTagName('iframe');
  var iframes = Array.prototype.slice.call(selection);
  iframes.forEach(function(iframe) {
    try {
      iframe.contentWindow.document.documentElement.style.setProperty(el.key, el.val);
      //iframe.contentWindow.document.documentElement.style.setProperty(el.key.replace("-bg-","-tx-"), contrastFontColor(el.val));
    } catch (error) {
      console.log(error)
    }
  });
}
function restoreViews(){
  var v=getStorageByType("view");
  if (v.length>0){
    var all=v[0].val.split(",");
    document.getElementById('template').contentWindow.tab_server=all;
    document.getElementById('template').contentWindow.loadVizInit(true);
  }
}
function restoreImgs(){
  getStorageByType("img").map((el)=>{
    $(document.getElementById('template').contentWindow.document.getElementById(el.key)).prop('src',el.val);
  })
}
function restoreTexts(){
  getStorageByType("text").map((el)=>{
    if(document.getElementById('template').contentWindow.document.getElementById(el.key)){
      document.getElementById('template').contentWindow.document.getElementById(el.key).innerHTML=decodeURIComponent(el.val);
    }
  })
}
function restoreColors(){
  getStorageByType("color").map((el)=>{
    document.getElementById('template').contentWindow.document.documentElement.style.setProperty(el.key, el.val);
    //document.getElementById('template').contentWindow.document.documentElement.style.setProperty(el.key.replace("-bg-","-tx-"), contrastFontColor(el.val));
    restoreColorInIframes(el);
  })
}
function getStorageByType(type){
  var ret=[];
  var pref=type+"---"+currentTemplate+'-';
  for (var i = 0; i < localStorage.length; i++){
    if(localStorage.key(i).indexOf(pref)!=-1)
      ret.push({key:localStorage.key(i).replace(pref,""),val:localStorage.getItem(localStorage.key(i))});
  }
  return ret;
}
function restoreViz(){
  setTimeout(() => {
    isTemplateLoaded= setInterval(function(){   
      if(typeof(document.getElementById('template').contentWindow.loadVizInit)!="undefined"){
        clearInterval(isTemplateLoaded);
        setTimeout(() => {
          restoreTexts();
          restoreImgs();
          restoreFilters();
          restoreViews();
          restoreFilters();
          restoreParameters();
          restoreWebEdit();
          restoreAskData();
          restoreAction();
          restoreColors();
        }, 500);
        $(".page-content").css("opacity","1");
      }
    }, 500);
  }, 1100);
 
}
function highlightElement(id){
  injectStyle(document.getElementById('template').contentWindow.document);
  $("#modal-tpset").animate({opacity:0},300);
  var el=$(document.getElementById('template').contentWindow.document.getElementById(id));
  el.addClass("blk");
  setTimeout(() => {
    el.removeClass("blk");
    setTimeout(() => {
      $("#modal-tpset").animate({opacity:1},300);
    }, 1000);
  }, 2000);

}
function injectStyle(docu){
  if(docu.getElementById("injectStyleH")==null){
    var css = ` .blk {
      animation-duration: 400ms;
      animation-name: blink;
      animation-iteration-count: infinite;
      animation-direction: alternate;
      }
      @keyframes blink {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }` 
      head = docu.head || docu.getElementsByTagName('head')[0],
      style = docu.createElement('style');
      style.id='injectStyleH'
      head.appendChild(style);
      style.type = 'text/css';
      if (style.styleSheet){
        // This is required for IE8 and below.
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(docu.createTextNode(css));
      }
  }
}
function getCurrentServerInfo(){
  var ret={host:localStorage.getItem("SERVER_URL"),site:localStorage.getItem("SITE_NAME")}
  return ret;
}
function filterViewList(ev){
  if(isTableauPublic()){
    if(ev.key=="Enter"){
      searchPublic();
      $(".tb").empty();
    }
    return;
  }
  var fil=$("#search").val().toUpperCase();
  if(fil!=""){
    $(".pdropdown .badge").addClass("badge-warning");
    $(".vdropdown .badge").addClass("badge-warning");
    $(".wbdropdown .badge").addClass("badge-warning");
  }
  else{
    $(".pdropdown .badge").removeClass("badge-warning");
    $(".vdropdown .badge").removeClass("badge-warning");
    $(".wbdropdown .badge").removeClass("badge-warning");
  }
  var fp=0;
  var fv=0;
  var fw=0;
  $(".proj").each((i,el)=>{
    if($(el).find(".thumb_text").text().toUpperCase().indexOf(fil)!=-1){
      $(el).show();
      fp+=1;
    }
    else{
      $(el).hide();
    }  
  })
  $(".wkb").each((i,el)=>{
    if($(el).find(".thumb_text").text().toUpperCase().indexOf(fil)!=-1){
      $(el).show();
      fw+=1;
    }
    else{
      $(el).hide();
    }  
  })
  $(".vie").each((i,el)=>{
    if($(el).find(".thumb_text").text().toUpperCase().indexOf(fil)!=-1){
      $(el).show();
      fv+=1;
    }
    else{
      $(el).hide();
    }  
  })
  $(".pnum").text(fp);
  $(".vnum").text(fv);
  $(".wbnum").text(fw);
}
function closeSettings(){
  try {
    if(panelSet)
      panelSet.close();
    pickers.forEach(el =>el.picker.hide())  
  } catch (error) {
  }
}
function createSettingsPanel(){
  $( "body" ).append(getSettingsTemplate());
  collapseDetailsPanelAuto();
  var setts=document.getElementById("settings")
  panelSet=jsPanel.create({
    content: setts,
    headerControls: 'closeonly md',
    contentSize: {width: '740px', height: '500px'},
    contentOverflow: 'hidden',
    headerTitle: "TEMPLATE SETTINGS",
    theme: "#31353D",
    onclosed: function(panel, closedByUser) {
      pickers.forEach(el =>el.picker.hide())  
    }
  });
}
function getSettingsTemplate(){
  return ` <main class="" id="settings" style="height:100%;width: 100%;">
  <div class="setblock">
    <details class="top" id="viewlist" open>

    </details>
    <details class="top" id="textlist">
        
    </details>
    <details class="top" id="imglist">
        
    </details>
    <details class="top" id="colorlist">
      
    </details>
</div>
  <footer class="setfooter">
    <button class="modal__btn modal__btn-primary" onclick="saveTemplateSettings(true)"> Close </button>
    <button class="modal__btn modal__btn-primary" onclick="saveTemplateSettings()"> Apply </button>
    <button onclick="closeSettings()" class="gogo modal__btn" data-micromodal-close aria-label="Close">Cancel</button>
  </footer>
</main>`
}
function getBase64Image(img) {
  var canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  var ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  var dataURL = canvas.toDataURL("image/png");
  document.body.appendChild(canvas)
  //return dataURL;
  return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
}
function trimURL(site){     
    return site.replace(/\/$/, "");
} 
function titleCase(str) {
  var splitStr = str.toLowerCase().split(' ');
  for (var i = 0; i < splitStr.length; i++) {
      splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);     
  }
  return splitStr.join(' '); 
}
function contrastFontColor(hexcolor){
	if (hexcolor.slice(0, 1) === '#') {
		hexcolor = hexcolor.slice(1);
	}
	if (hexcolor.length === 3) {
		hexcolor = hexcolor.split('').map(function (hex) {
			return hex + hex;
		}).join('');
	}
	var r = parseInt(hexcolor.substr(0,2),16);
	var g = parseInt(hexcolor.substr(2,2),16);
	var b = parseInt(hexcolor.substr(4,2),16);
	var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
	return (yiq >= 128) ? 'black' : 'white';
};
function exportTemplate(name){
  let a=getStorageByType("webedit");
  let b=getStorageByType("askdata");
  let c=getStorageByType("parameter");
  let d=getStorageByType("filter");
  let e=getStorageByType("view");
  let f=getStorageByType("img");
  let g=getStorageByType("text");
  let h=getStorageByType("color");
  let i=getStorageByType("widget");
  let j=getStorageByType("action");
  var all={"title":name.replaceAll(".zip",""),"widget":JSON.stringify(i),"tpname":currentTemplate.replace("templates/","").replace("/index.html",""),"view":JSON.stringify(e),"filter":JSON.stringify(d),"parameter":JSON.stringify(c),"webedit":JSON.stringify(a),"askdata":JSON.stringify(b),"text":JSON.stringify(g),"img":JSON.stringify(f),"color":JSON.stringify(h),"action":JSON.stringify(j)}
  var formBody = formize(all);
  fetch("/zip", {
    method: "POST", 
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formBody
  }).then( res => 
    res.blob() )
    .then( blob => {
       saveFile(blob,name.replaceAll(".zip","")+".zip")
    });
}
function saveFile(blob, filename) {
  if (window.navigator.msSaveOrOpenBlob) {
    window.navigator.msSaveOrOpenBlob(blob, filename);
  } else {
    const a = document.createElement('a');
    document.body.appendChild(a);
    const url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 0)
  }
}
function selectedPict(){
 var jur=$(".searchres.selected");
 var ur=jur.prop("src");
 var tg=$(`.imgs.input.sh[varc='${jur.attr("varc")}']`)
 tg.val(ur);
 MicroModal.close('modal-pict');
}
function capitalizeIt(str) {
  var lower = str.toLowerCase();
  return str.charAt(0).toUpperCase() + lower.slice(1);
}
function togglePublic(){
  $(".vdropdown").removeClass("active");
  $(".vdropsub").hide();
  $("#search").val("");
  $(".tol-section").toggle();
  if(isTableauPublic()){
    $(".loadp").show();
    $(".loadwb").show();
    $("#search").prop("placeholder","Search in Public...");
  }
  else{
    if(checkSettings()==false){
      showSettings();
      $(".tol-section").toggle();
      $(".tabpub input").prop("checked",true);
      return;
    }
    getProjects();
    $("#search").prop("placeholder","Search...");
    $(".pdropdown .badge").removeClass("badge-warning");
    $(".vdropdown .badge").removeClass("badge-warning");
    $(".wbdropdown .badge").removeClass("badge-warning");
  }
  $(".vnum").text("");
  $(".pnum").text("");
  $(".wbnum").text("");
  $(".tb").empty();
  var ev=new Event('resize');
  ev.fake=true;
  window.dispatchEvent(ev);

}
function isTableauPublic(){
  return !$(".tol-section").is(":visible");
}
function cleanURLBadChar(st){
  st=st.replaceAll(" ","").replaceAll("#","").replaceAll("/","").replaceAll("?","").replaceAll(",","").replaceAll("&","").replaceAll(":","").replaceAll("(","").replaceAll(")","").replaceAll(".","_").replaceAll('"',"")
  return trickyReplace(st)
}
function trickyReplace(text){
  const accentsMap = new Map([
    ["a", "á|à|ã|â|ä"],
    ["e", "é|è|ê|ë"],
    ["i", "í|ì|î|ï"],
    ["o", "ó|ò|ô|õ|ö"],
    ["u", "ú|ù|û|ü"],
    ["c", "ç"],
    ["n", "ñ"]
  ]);
  
  const reducer = (acc, [key]) =>
  acc.replace(new RegExp(accentsMap.get(key), "gi"), "");
  return [...accentsMap].reduce(reducer, text);
}
function searchPublic(start=0){
  $(".loadmr").css("display","inline-block");
  $(".loadview").show();
  $(".loadmore span").text("");
  $(".vnum").text("");
  var prf="https://public.tableau.com/static/images/";
  console.log("search public");
  fetch(`/public?search=${encodeURIComponent($("#search").val())}&start=${start}`)
  .then(response => response.json())
  .then(data => {
    $(".loadmore").remove();
    $(".tb").show();
    var vs=[];
    data.results.map((el)=>{
      vs.push({
        url:prf+el.workbook.workbookRepoUrl.substring(0, 2) +"/"+ cleanURLBadChar(el.workbook.workbookRepoUrl)+"/"+cleanURLBadChar(el.workbook.defaultViewName)+'/4_3.png',
        name:el.workbook.defaultViewName.replaceAll('"',""),
        link:"https://public.tableau.com/views/"+el.workbook.defaultViewRepoUrl.replace("/sheets","")+"?:showVizHome=no&:embed=true"
      })
    })
    populateViews(vs,true);
    $(".vnum").text($(".thumb.vie").length+"/"+data.facets.entity_type.vizzes);
    var total=parseInt(data.facets.entity_type.vizzes);
    if($(".thumb.vie").length<total){
      var increment=$(".thumb.vie").length+1
      $(".tb").append(`<div class="nosel loadmore" onclick="searchPublic(${increment})"><div class="loadmr spinner-border text-success" role="status"></div><span>Load More...</span><div>`)
    }
  });
}
function clearAllSettings(){
  MicroModal.close('modal-settings'); 
  showModal("modal-confirm");
}
function clearAllDamn(b){
  MicroModal.close('modal-confirm'); 
  if(b==true){
    var ve=localStorage.getItem("VERSION");
    var su=localStorage.getItem("SERVER_URL");
    var sn=localStorage.getItem("SITE_NAME");
    var tn=localStorage.getItem("TOKEN_NAME");
    var tv=localStorage.getItem("TOKEN_VALUE");
    var wa=localStorage.getItem("WARN");
    localStorage.clear();
    localStorage.setItem("VERSION",ve);
    localStorage.setItem("SERVER_URL",su);
    localStorage.setItem("SITE_NAME",sn);
    localStorage.setItem("TOKEN_NAME",tn);
    localStorage.setItem("TOKEN_VALUE",tv);
    localStorage.setItem("WARN",wa);
    reloadMe(true);
  }
}
function openExportOptions(ev){
  ev.stopPropagation();
  showModal('modal-export');
  $('.gogo').focus();
  $("#exportname").val(friendlyTpName[currentTemplate]+".zip")
}
function exportOptions(conf){
  MicroModal.close('modal-export'); 
  if (conf==true){
    exportTemplate($("#exportname").val());
    setTimeout(() => {
      if($("#exportconf").prop('checked'))
      saveToFile($("#exportname").val());
    }, 1000);
  }
}
String.prototype.hashCode = function() {
  var hash = 0, i, chr;
  if (this.length === 0) return hash;
  for (i = 0; i < this.length; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};
