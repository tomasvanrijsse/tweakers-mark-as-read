// ==UserScript==
// @name         Tweakers.net Mark as read
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  Hide all news which has been read or you don't want to read
// @author       Tomas van Rijsse
// @match        tweakers.net/*
// @grant        none
// @require      https://code.jquery.com/jquery-3.4.1.slim.min.js
// ==/UserScript==
/* jshint -W097 */
/* global jQuery */

var json = localStorage.getItem('articles') || "{}",
    articles = JSON.parse(json);

jQuery(function($){

    $('body').append('<style>'+
                    '.headlineItem.selected { background-color: rgba(0,0,0,0.2); }'+
                     '.headlineItem.selected article.headline a {opacity:0.5}'+
                     '.headlineItem.hiddenForMe article.headline a {opacity:0.3}'+
                     '</style>');

    markAsRead();

    if(document.location.pathname == '/'){
        var home = new Home($);

        var target = document.getElementsByClassName('headlines')[0];

        // create an observer instance
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                home.hideArticles();
            });
        });

        // configuration of the observer:
        var config = { attributes: true, childList: true, characterData: true };

        // pass in the target node, as well as the observer options
        observer.observe(target, config);
    }
});

function markAsRead(){
    var id = getLinkId(document.location.href);
    if( getLinkId(document.location.href) !== null ){
        articles[id]= true;
        localStorage.setItem('articles',JSON.stringify(articles));
    }
}

var Home = function($){
    var self = this;
    self.isMouseDown = false;

    self.hideArticles();

    $(".headlineItem").mousedown(function () {
        self.isMouseDown = true;

        $('.headlines .activeSelection').removeClass('activeSelection');
        $(this).parent().addClass('activeSelection');

        $(".headlineItem").removeClass("selectionStart selected selectionEnd");
        $(this).addClass("selectionStart selected");
        return false; // prevent text selection
    })
        .mouseenter(function () {
        if (self.isMouseDown && $(this).parent().hasClass('activeSelection')) {
            $(".headlineItem").removeClass('selectionEnd');
            $(this).addClass("selectionEnd");
            self.selectInBetween($);
        }
    })
        .bind("selectstart", function () {
        return false; // prevent text selection in IE
    });

    $(document).mouseup(function () {
        self.isMouseDown = false;
        $(".headlineItem").removeClass('selectionStart selectionEnd');
    })
        .keyup(function(e) {
        var code = (e.keyCode ? e.keyCode : e.which);
        if (code==13 &&  $(".headlineItem.selected").length) {
            e.preventDefault();

            $(".headlineItem.selected").each(function(){
                var id = getLinkId($(this).find('article.headline a').prop('href'));
                if(id){
                    articles[id] = true;
                }
            }).removeClass('selected').addClass('hiddenForMe');

            localStorage.setItem('articles',JSON.stringify(articles));
        }

        if (code==27 && $(".headlineItem.selected").length) {
            e.preventDefault();
            $(".headlineItem.selected").removeClass('selected');
        }

    });
};
Home.prototype = {
    hideArticles:function(){
        /* hide articles on load */
        $('.headlineItem').each(function(){
            var $tr = $(this),
                id = getLinkId($tr.find('a').first().prop('href'));

            if(id === null) return true;

            if(articles.hasOwnProperty(id)){
                $tr.addClass('hiddenForMe');
            }
        });
    },
    selectInBetween: function($){

        var $table = $('.headlines div.activeSelection'),
            $inBetweeners = $table.find('.headlineItem.selectionStart ~ .headlineItem')
            .not('.headlineItem.selectionEnd ~ .headlineItem');

        if($inBetweeners.length == 0){
            $inBetweeners = $table.find('.headlineItem.selectionEnd ~ .headlineItem')
            .not('.headlineItem.selectionStart ~ .headlineItem');
        };

        $inBetweeners.addClass('selected');
        $table.find('.headlineItem').not($inBetweeners).removeClass('selected');

        $table.find('.headlineItem.selectionStart, .headlineItem.selectionEnd').addClass('selected');

    }
};

function getLinkId(link){
    if(!link){
        return null
    }

    var newsRegex = RegExp('\.net\/([a-z]{4,20})\/([0-9]{4,6})','');
    var ids = link.match(newsRegex);

    if(ids === null){
        return null;
    }

    return ids[1]+ids[2];
}
