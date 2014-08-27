define(function (require, exports, module) {
	var $ = require("lib/zepto");
	var ns = {
		init : function () {
			var ns = this;
			ns.img.onerrorImgUrl = "",
			ns.img.srcStore = "data-img",
			ns.img.class = "lazy",
			ns.img.sensitivity = 50,
			ns.img.init()
		},
		img : {
			trigger : function () {
				var ns = this;
				eventType = ns.isPhone && "touchend" || "scroll",
				ns.imglist = $("img." + ns.class),
				$(window).trigger(eventType);
			},
			init : function () {
				var ns = this,
				minDistance = 5,
				minResponseTime = 200,
				iOSVersionMatch = navigator.appVersion.match(/(iPhone\sOS)\s([\d_]+)/),
				isIphone = iOSVersionMatch && !0 || !1,
				version = isIphone && iOSVersionMatch[2].split("_");
				
				
				if(version){
					if(version.length > 1){
						version = parseFloat(version.splice(0,2).join('.'), 10);
					}
					else{
						version = parseFloat(version[0], 10);
					}
				}
				
				ns.isPhone = isIphone && version < 6;
				
				if (ns.isPhone) {
					var startEvent,
					timer;
					$(window).on("touchstart", function () {
						startEvent = {
							sy : window.scrollY,
							time : Date.now()
						},
						timer && clearTimeout(timer)
					}).on("touchend", function (evt) {
						if (evt && evt.changedTouches) {
							var distance = Math.abs(window.scrollY - startEvent.sy);
							if (distance > minDistance) {
								var responseTime = Date.now() - startEvent.time;
								timer = setTimeout(function () {
										ns.changeimg(),
										startEvent = {},
										clearTimeout(timer),
										timer = null
									}, responseTime > minResponseTime ? 0 : 200)
							}
						} else{
							ns.changeimg()
						}
					}).on("touchcancel", function () {
						timer && clearTimeout(timer),
						startEvent = {}

					});
				} else{
					$(window).on("scroll", function () {
						ns.changeimg()
					});
				}
				ns.trigger();
				ns.isload = true;
			},
			changeimg : function () {
				function isInView(el) {
					var top = window.pageYOffset,
					bottom = window.pageYOffset + window.innerHeight,
					elTop = el.offset().top;
					return elTop >= top && elTop - ns.sensitivity <= bottom
				}
				function showImg(el, index) {
					var realSrc = el.attr(ns.srcStore);
					el.attr("src", realSrc),
					el[0].onload || (el[0].onload = function () {
						$(this).removeClass(ns.class).removeAttr(ns.srcStore),
						ns.imglist[index] = null,
						this.onerror = this.onload = null
					}, el[0].onerror = function () {
						if(ns.onerrorImgUrl){
							this.src = ns.onerrorImgUrl;
						}
						$(this).removeClass(ns.class).removeAttr(ns.srcStore),
						ns.imglist[index] = null,
						this.onerror = this.onload = null
					})
				}
				var ns = this;
				ns.imglist.each(function (index, el) {
					if (el) {
						el = $(el);
						if(isInView(el)){
							el.attr(ns.srcStore) && showImg(el, index)
						}
					}
				})
			}
		}
	};
	return ns;
})