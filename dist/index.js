(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Tracker = factory());
})(this, (function () { 'use strict';

    var TrackerConfig;
    (function (TrackerConfig) {
        TrackerConfig["version"] = "1.0.0";
    })(TrackerConfig || (TrackerConfig = {}));

    // 重写pushState和replaceState:因为history监听不到
    const createHistoryEvent = (type) => {
        //获取到函数
        const orign = history[type];
        return function () {
            //这里的this是一个假参数
            const res = orign.apply(this, arguments);
            // 创建事件
            const e = new Event(type);
            // 派发事件
            window.dispatchEvent(e);
            return res;
        };
    };
    // window.addEventListener
    // createHistoryEvent("pushState")

    function utcFormat(time) {
        var date = new Date(time), year = date.getFullYear(), month = date.getMonth() + 1 > 9
            ? date.getMonth() + 1
            : '0' + (date.getMonth() + 1), day = date.getDate() > 9 ? date.getDate() : '0' + date.getDate(), hour = date.getHours() > 9 ? date.getHours() : '0' + date.getHours(), minutes = date.getMinutes() > 9 ? date.getMinutes() : '0' + date.getMinutes(), seconds = date.getSeconds() > 9 ? date.getSeconds() : '0' + date.getSeconds();
        var res = year + '-' + month + '-' + day + ' ' + hour + ':' + minutes + ':' + seconds;
        return res;
    }

    function getAliyun(project, host, logstore, result) {
        let url = `http://${project}.${host}/logstores/${logstore}/track`;
        //因为阿里云要求必须都是字符串类型
        for (const key in result) {
            //处理对象类型
            if (typeof result[key] == 'object') {
                result[key] = JSON.stringify(result[key]);
            }
            else {
                result[key] = `${result[key]}`;
            }
        }
        let body = JSON.stringify({
            __logs__: [result],
        });
        let xhr = new XMLHttpRequest();
        xhr.open('post', url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('x-log-apiversion', '0.6.0');
        xhr.setRequestHeader('x-log-bodyrawsize', `${result.length}`);
        xhr.onload = function (res) {
            console.log('阿里云上报成功');
        };
        xhr.onerror = function (error) {
            console.log('阿里云上报失败');
        };
        xhr.send(body);
    }

    function domTracker(handler, eventTrackedList) {
        // 需要监听的事件
        const MouseEventList = eventTrackedList;
        MouseEventList.forEach((event) => {
            window.addEventListener(event, (e) => handler(e, event), {
                capture: true, //捕获：为了让获得的是最底层的那个，也是为了实现那个路径的功能
                passive: true, //性能优化
            });
        });
    }

    function RouterChangeTracker(handler) {
        window.addEventListener('pushState', (e) => handler(e), true);
        window.addEventListener('replaceState', (e) => handler(e), true);
        window.addEventListener('popstate', (e) => handler(e), true);
    }

    function OriginInformationTracker() {
        return {
            referrer: document.referrer,
            type: performance.getEntriesByType('navigation')[0].type,
        };
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var uaParser = createCommonjsModule(function (module, exports) {
    /////////////////////////////////////////////////////////////////////////////////
    /* UAParser.js v1.0.37
       Copyright © 2012-2021 Faisal Salman <f@faisalman.com>
       MIT License *//*
       Detect Browser, Engine, OS, CPU, and Device type/model from User-Agent data.
       Supports browser & node.js environment. 
       Demo   : https://faisalman.github.io/ua-parser-js
       Source : https://github.com/faisalman/ua-parser-js */
    /////////////////////////////////////////////////////////////////////////////////

    (function (window, undefined$1) {

        //////////////
        // Constants
        /////////////


        var LIBVERSION  = '1.0.37',
            EMPTY       = '',
            UNKNOWN     = '?',
            FUNC_TYPE   = 'function',
            UNDEF_TYPE  = 'undefined',
            OBJ_TYPE    = 'object',
            STR_TYPE    = 'string',
            MAJOR       = 'major',
            MODEL       = 'model',
            NAME        = 'name',
            TYPE        = 'type',
            VENDOR      = 'vendor',
            VERSION     = 'version',
            ARCHITECTURE= 'architecture',
            CONSOLE     = 'console',
            MOBILE      = 'mobile',
            TABLET      = 'tablet',
            SMARTTV     = 'smarttv',
            WEARABLE    = 'wearable',
            EMBEDDED    = 'embedded',
            UA_MAX_LENGTH = 500;

        var AMAZON  = 'Amazon',
            APPLE   = 'Apple',
            ASUS    = 'ASUS',
            BLACKBERRY = 'BlackBerry',
            BROWSER = 'Browser',
            CHROME  = 'Chrome',
            EDGE    = 'Edge',
            FIREFOX = 'Firefox',
            GOOGLE  = 'Google',
            HUAWEI  = 'Huawei',
            LG      = 'LG',
            MICROSOFT = 'Microsoft',
            MOTOROLA  = 'Motorola',
            OPERA   = 'Opera',
            SAMSUNG = 'Samsung',
            SHARP   = 'Sharp',
            SONY    = 'Sony',
            XIAOMI  = 'Xiaomi',
            ZEBRA   = 'Zebra',
            FACEBOOK    = 'Facebook',
            CHROMIUM_OS = 'Chromium OS',
            MAC_OS  = 'Mac OS';

        ///////////
        // Helper
        //////////

        var extend = function (regexes, extensions) {
                var mergedRegexes = {};
                for (var i in regexes) {
                    if (extensions[i] && extensions[i].length % 2 === 0) {
                        mergedRegexes[i] = extensions[i].concat(regexes[i]);
                    } else {
                        mergedRegexes[i] = regexes[i];
                    }
                }
                return mergedRegexes;
            },
            enumerize = function (arr) {
                var enums = {};
                for (var i=0; i<arr.length; i++) {
                    enums[arr[i].toUpperCase()] = arr[i];
                }
                return enums;
            },
            has = function (str1, str2) {
                return typeof str1 === STR_TYPE ? lowerize(str2).indexOf(lowerize(str1)) !== -1 : false;
            },
            lowerize = function (str) {
                return str.toLowerCase();
            },
            majorize = function (version) {
                return typeof(version) === STR_TYPE ? version.replace(/[^\d\.]/g, EMPTY).split('.')[0] : undefined$1;
            },
            trim = function (str, len) {
                if (typeof(str) === STR_TYPE) {
                    str = str.replace(/^\s\s*/, EMPTY);
                    return typeof(len) === UNDEF_TYPE ? str : str.substring(0, UA_MAX_LENGTH);
                }
        };

        ///////////////
        // Map helper
        //////////////

        var rgxMapper = function (ua, arrays) {

                var i = 0, j, k, p, q, matches, match;

                // loop through all regexes maps
                while (i < arrays.length && !matches) {

                    var regex = arrays[i],       // even sequence (0,2,4,..)
                        props = arrays[i + 1];   // odd sequence (1,3,5,..)
                    j = k = 0;

                    // try matching uastring with regexes
                    while (j < regex.length && !matches) {

                        if (!regex[j]) { break; }
                        matches = regex[j++].exec(ua);

                        if (!!matches) {
                            for (p = 0; p < props.length; p++) {
                                match = matches[++k];
                                q = props[p];
                                // check if given property is actually array
                                if (typeof q === OBJ_TYPE && q.length > 0) {
                                    if (q.length === 2) {
                                        if (typeof q[1] == FUNC_TYPE) {
                                            // assign modified match
                                            this[q[0]] = q[1].call(this, match);
                                        } else {
                                            // assign given value, ignore regex match
                                            this[q[0]] = q[1];
                                        }
                                    } else if (q.length === 3) {
                                        // check whether function or regex
                                        if (typeof q[1] === FUNC_TYPE && !(q[1].exec && q[1].test)) {
                                            // call function (usually string mapper)
                                            this[q[0]] = match ? q[1].call(this, match, q[2]) : undefined$1;
                                        } else {
                                            // sanitize match using given regex
                                            this[q[0]] = match ? match.replace(q[1], q[2]) : undefined$1;
                                        }
                                    } else if (q.length === 4) {
                                            this[q[0]] = match ? q[3].call(this, match.replace(q[1], q[2])) : undefined$1;
                                    }
                                } else {
                                    this[q] = match ? match : undefined$1;
                                }
                            }
                        }
                    }
                    i += 2;
                }
            },

            strMapper = function (str, map) {

                for (var i in map) {
                    // check if current value is array
                    if (typeof map[i] === OBJ_TYPE && map[i].length > 0) {
                        for (var j = 0; j < map[i].length; j++) {
                            if (has(map[i][j], str)) {
                                return (i === UNKNOWN) ? undefined$1 : i;
                            }
                        }
                    } else if (has(map[i], str)) {
                        return (i === UNKNOWN) ? undefined$1 : i;
                    }
                }
                return str;
        };

        ///////////////
        // String map
        //////////////

        // Safari < 3.0
        var oldSafariMap = {
                '1.0'   : '/8',
                '1.2'   : '/1',
                '1.3'   : '/3',
                '2.0'   : '/412',
                '2.0.2' : '/416',
                '2.0.3' : '/417',
                '2.0.4' : '/419',
                '?'     : '/'
            },
            windowsVersionMap = {
                'ME'        : '4.90',
                'NT 3.11'   : 'NT3.51',
                'NT 4.0'    : 'NT4.0',
                '2000'      : 'NT 5.0',
                'XP'        : ['NT 5.1', 'NT 5.2'],
                'Vista'     : 'NT 6.0',
                '7'         : 'NT 6.1',
                '8'         : 'NT 6.2',
                '8.1'       : 'NT 6.3',
                '10'        : ['NT 6.4', 'NT 10.0'],
                'RT'        : 'ARM'
        };

        //////////////
        // Regex map
        /////////////

        var regexes = {

            browser : [[

                /\b(?:crmo|crios)\/([\w\.]+)/i                                      // Chrome for Android/iOS
                ], [VERSION, [NAME, 'Chrome']], [
                /edg(?:e|ios|a)?\/([\w\.]+)/i                                       // Microsoft Edge
                ], [VERSION, [NAME, 'Edge']], [

                // Presto based
                /(opera mini)\/([-\w\.]+)/i,                                        // Opera Mini
                /(opera [mobiletab]{3,6})\b.+version\/([-\w\.]+)/i,                 // Opera Mobi/Tablet
                /(opera)(?:.+version\/|[\/ ]+)([\w\.]+)/i                           // Opera
                ], [NAME, VERSION], [
                /opios[\/ ]+([\w\.]+)/i                                             // Opera mini on iphone >= 8.0
                ], [VERSION, [NAME, OPERA+' Mini']], [
                /\bopr\/([\w\.]+)/i                                                 // Opera Webkit
                ], [VERSION, [NAME, OPERA]], [

                // Mixed
                /\bb[ai]*d(?:uhd|[ub]*[aekoprswx]{5,6})[\/ ]?([\w\.]+)/i            // Baidu
                ], [VERSION, [NAME, 'Baidu']], [
                /(kindle)\/([\w\.]+)/i,                                             // Kindle
                /(lunascape|maxthon|netfront|jasmine|blazer)[\/ ]?([\w\.]*)/i,      // Lunascape/Maxthon/Netfront/Jasmine/Blazer
                // Trident based
                /(avant|iemobile|slim)\s?(?:browser)?[\/ ]?([\w\.]*)/i,             // Avant/IEMobile/SlimBrowser
                /(?:ms|\()(ie) ([\w\.]+)/i,                                         // Internet Explorer

                // Webkit/KHTML based                                               // Flock/RockMelt/Midori/Epiphany/Silk/Skyfire/Bolt/Iron/Iridium/PhantomJS/Bowser/QupZilla/Falkon
                /(flock|rockmelt|midori|epiphany|silk|skyfire|bolt|iron|vivaldi|iridium|phantomjs|bowser|quark|qupzilla|falkon|rekonq|puffin|brave|whale(?!.+naver)|qqbrowserlite|qq|duckduckgo)\/([-\w\.]+)/i,
                                                                                    // Rekonq/Puffin/Brave/Whale/QQBrowserLite/QQ, aka ShouQ
                /(heytap|ovi)browser\/([\d\.]+)/i,                                  // Heytap/Ovi
                /(weibo)__([\d\.]+)/i                                               // Weibo
                ], [NAME, VERSION], [
                /(?:\buc? ?browser|(?:juc.+)ucweb)[\/ ]?([\w\.]+)/i                 // UCBrowser
                ], [VERSION, [NAME, 'UC'+BROWSER]], [
                /microm.+\bqbcore\/([\w\.]+)/i,                                     // WeChat Desktop for Windows Built-in Browser
                /\bqbcore\/([\w\.]+).+microm/i,
                /micromessenger\/([\w\.]+)/i                                        // WeChat
                ], [VERSION, [NAME, 'WeChat']], [
                /konqueror\/([\w\.]+)/i                                             // Konqueror
                ], [VERSION, [NAME, 'Konqueror']], [
                /trident.+rv[: ]([\w\.]{1,9})\b.+like gecko/i                       // IE11
                ], [VERSION, [NAME, 'IE']], [
                /ya(?:search)?browser\/([\w\.]+)/i                                  // Yandex
                ], [VERSION, [NAME, 'Yandex']], [
                /slbrowser\/([\w\.]+)/i                                             // Smart Lenovo Browser
                ], [VERSION, [NAME, 'Smart Lenovo '+BROWSER]], [
                /(avast|avg)\/([\w\.]+)/i                                           // Avast/AVG Secure Browser
                ], [[NAME, /(.+)/, '$1 Secure '+BROWSER], VERSION], [
                /\bfocus\/([\w\.]+)/i                                               // Firefox Focus
                ], [VERSION, [NAME, FIREFOX+' Focus']], [
                /\bopt\/([\w\.]+)/i                                                 // Opera Touch
                ], [VERSION, [NAME, OPERA+' Touch']], [
                /coc_coc\w+\/([\w\.]+)/i                                            // Coc Coc Browser
                ], [VERSION, [NAME, 'Coc Coc']], [
                /dolfin\/([\w\.]+)/i                                                // Dolphin
                ], [VERSION, [NAME, 'Dolphin']], [
                /coast\/([\w\.]+)/i                                                 // Opera Coast
                ], [VERSION, [NAME, OPERA+' Coast']], [
                /miuibrowser\/([\w\.]+)/i                                           // MIUI Browser
                ], [VERSION, [NAME, 'MIUI '+BROWSER]], [
                /fxios\/([-\w\.]+)/i                                                // Firefox for iOS
                ], [VERSION, [NAME, FIREFOX]], [
                /\bqihu|(qi?ho?o?|360)browser/i                                     // 360
                ], [[NAME, '360 ' + BROWSER]], [
                /(oculus|sailfish|huawei|vivo)browser\/([\w\.]+)/i
                ], [[NAME, /(.+)/, '$1 ' + BROWSER], VERSION], [                    // Oculus/Sailfish/HuaweiBrowser/VivoBrowser
                /samsungbrowser\/([\w\.]+)/i                                        // Samsung Internet
                ], [VERSION, [NAME, SAMSUNG + ' Internet']], [
                /(comodo_dragon)\/([\w\.]+)/i                                       // Comodo Dragon
                ], [[NAME, /_/g, ' '], VERSION], [
                /metasr[\/ ]?([\d\.]+)/i                                            // Sogou Explorer
                ], [VERSION, [NAME, 'Sogou Explorer']], [
                /(sogou)mo\w+\/([\d\.]+)/i                                          // Sogou Mobile
                ], [[NAME, 'Sogou Mobile'], VERSION], [
                /(electron)\/([\w\.]+) safari/i,                                    // Electron-based App
                /(tesla)(?: qtcarbrowser|\/(20\d\d\.[-\w\.]+))/i,                   // Tesla
                /m?(qqbrowser|2345Explorer)[\/ ]?([\w\.]+)/i                        // QQBrowser/2345 Browser
                ], [NAME, VERSION], [
                /(lbbrowser)/i,                                                     // LieBao Browser
                /\[(linkedin)app\]/i                                                // LinkedIn App for iOS & Android
                ], [NAME], [

                // WebView
                /((?:fban\/fbios|fb_iab\/fb4a)(?!.+fbav)|;fbav\/([\w\.]+);)/i       // Facebook App for iOS & Android
                ], [[NAME, FACEBOOK], VERSION], [
                /(Klarna)\/([\w\.]+)/i,                                             // Klarna Shopping Browser for iOS & Android
                /(kakao(?:talk|story))[\/ ]([\w\.]+)/i,                             // Kakao App
                /(naver)\(.*?(\d+\.[\w\.]+).*\)/i,                                  // Naver InApp
                /safari (line)\/([\w\.]+)/i,                                        // Line App for iOS
                /\b(line)\/([\w\.]+)\/iab/i,                                        // Line App for Android
                /(alipay)client\/([\w\.]+)/i,                                       // Alipay
                /(chromium|instagram|snapchat)[\/ ]([-\w\.]+)/i                     // Chromium/Instagram/Snapchat
                ], [NAME, VERSION], [
                /\bgsa\/([\w\.]+) .*safari\//i                                      // Google Search Appliance on iOS
                ], [VERSION, [NAME, 'GSA']], [
                /musical_ly(?:.+app_?version\/|_)([\w\.]+)/i                        // TikTok
                ], [VERSION, [NAME, 'TikTok']], [

                /headlesschrome(?:\/([\w\.]+)| )/i                                  // Chrome Headless
                ], [VERSION, [NAME, CHROME+' Headless']], [

                / wv\).+(chrome)\/([\w\.]+)/i                                       // Chrome WebView
                ], [[NAME, CHROME+' WebView'], VERSION], [

                /droid.+ version\/([\w\.]+)\b.+(?:mobile safari|safari)/i           // Android Browser
                ], [VERSION, [NAME, 'Android '+BROWSER]], [

                /(chrome|omniweb|arora|[tizenoka]{5} ?browser)\/v?([\w\.]+)/i       // Chrome/OmniWeb/Arora/Tizen/Nokia
                ], [NAME, VERSION], [

                /version\/([\w\.\,]+) .*mobile\/\w+ (safari)/i                      // Mobile Safari
                ], [VERSION, [NAME, 'Mobile Safari']], [
                /version\/([\w(\.|\,)]+) .*(mobile ?safari|safari)/i                // Safari & Safari Mobile
                ], [VERSION, NAME], [
                /webkit.+?(mobile ?safari|safari)(\/[\w\.]+)/i                      // Safari < 3.0
                ], [NAME, [VERSION, strMapper, oldSafariMap]], [

                /(webkit|khtml)\/([\w\.]+)/i
                ], [NAME, VERSION], [

                // Gecko based
                /(navigator|netscape\d?)\/([-\w\.]+)/i                              // Netscape
                ], [[NAME, 'Netscape'], VERSION], [
                /mobile vr; rv:([\w\.]+)\).+firefox/i                               // Firefox Reality
                ], [VERSION, [NAME, FIREFOX+' Reality']], [
                /ekiohf.+(flow)\/([\w\.]+)/i,                                       // Flow
                /(swiftfox)/i,                                                      // Swiftfox
                /(icedragon|iceweasel|camino|chimera|fennec|maemo browser|minimo|conkeror|klar)[\/ ]?([\w\.\+]+)/i,
                                                                                    // IceDragon/Iceweasel/Camino/Chimera/Fennec/Maemo/Minimo/Conkeror/Klar
                /(seamonkey|k-meleon|icecat|iceape|firebird|phoenix|palemoon|basilisk|waterfox)\/([-\w\.]+)$/i,
                                                                                    // Firefox/SeaMonkey/K-Meleon/IceCat/IceApe/Firebird/Phoenix
                /(firefox)\/([\w\.]+)/i,                                            // Other Firefox-based
                /(mozilla)\/([\w\.]+) .+rv\:.+gecko\/\d+/i,                         // Mozilla

                // Other
                /(polaris|lynx|dillo|icab|doris|amaya|w3m|netsurf|sleipnir|obigo|mosaic|(?:go|ice|up)[\. ]?browser)[-\/ ]?v?([\w\.]+)/i,
                                                                                    // Polaris/Lynx/Dillo/iCab/Doris/Amaya/w3m/NetSurf/Sleipnir/Obigo/Mosaic/Go/ICE/UP.Browser
                /(links) \(([\w\.]+)/i,                                             // Links
                /panasonic;(viera)/i                                                // Panasonic Viera
                ], [NAME, VERSION], [
                
                /(cobalt)\/([\w\.]+)/i                                              // Cobalt
                ], [NAME, [VERSION, /master.|lts./, ""]]
            ],

            cpu : [[

                /(?:(amd|x(?:(?:86|64)[-_])?|wow|win)64)[;\)]/i                     // AMD64 (x64)
                ], [[ARCHITECTURE, 'amd64']], [

                /(ia32(?=;))/i                                                      // IA32 (quicktime)
                ], [[ARCHITECTURE, lowerize]], [

                /((?:i[346]|x)86)[;\)]/i                                            // IA32 (x86)
                ], [[ARCHITECTURE, 'ia32']], [

                /\b(aarch64|arm(v?8e?l?|_?64))\b/i                                 // ARM64
                ], [[ARCHITECTURE, 'arm64']], [

                /\b(arm(?:v[67])?ht?n?[fl]p?)\b/i                                   // ARMHF
                ], [[ARCHITECTURE, 'armhf']], [

                // PocketPC mistakenly identified as PowerPC
                /windows (ce|mobile); ppc;/i
                ], [[ARCHITECTURE, 'arm']], [

                /((?:ppc|powerpc)(?:64)?)(?: mac|;|\))/i                            // PowerPC
                ], [[ARCHITECTURE, /ower/, EMPTY, lowerize]], [

                /(sun4\w)[;\)]/i                                                    // SPARC
                ], [[ARCHITECTURE, 'sparc']], [

                /((?:avr32|ia64(?=;))|68k(?=\))|\barm(?=v(?:[1-7]|[5-7]1)l?|;|eabi)|(?=atmel )avr|(?:irix|mips|sparc)(?:64)?\b|pa-risc)/i
                                                                                    // IA64, 68K, ARM/64, AVR/32, IRIX/64, MIPS/64, SPARC/64, PA-RISC
                ], [[ARCHITECTURE, lowerize]]
            ],

            device : [[

                //////////////////////////
                // MOBILES & TABLETS
                /////////////////////////

                // Samsung
                /\b(sch-i[89]0\d|shw-m380s|sm-[ptx]\w{2,4}|gt-[pn]\d{2,4}|sgh-t8[56]9|nexus 10)/i
                ], [MODEL, [VENDOR, SAMSUNG], [TYPE, TABLET]], [
                /\b((?:s[cgp]h|gt|sm)-\w+|sc[g-]?[\d]+a?|galaxy nexus)/i,
                /samsung[- ]([-\w]+)/i,
                /sec-(sgh\w+)/i
                ], [MODEL, [VENDOR, SAMSUNG], [TYPE, MOBILE]], [

                // Apple
                /(?:\/|\()(ip(?:hone|od)[\w, ]*)(?:\/|;)/i                          // iPod/iPhone
                ], [MODEL, [VENDOR, APPLE], [TYPE, MOBILE]], [
                /\((ipad);[-\w\),; ]+apple/i,                                       // iPad
                /applecoremedia\/[\w\.]+ \((ipad)/i,
                /\b(ipad)\d\d?,\d\d?[;\]].+ios/i
                ], [MODEL, [VENDOR, APPLE], [TYPE, TABLET]], [
                /(macintosh);/i
                ], [MODEL, [VENDOR, APPLE]], [

                // Sharp
                /\b(sh-?[altvz]?\d\d[a-ekm]?)/i
                ], [MODEL, [VENDOR, SHARP], [TYPE, MOBILE]], [

                // Huawei
                /\b((?:ag[rs][23]?|bah2?|sht?|btv)-a?[lw]\d{2})\b(?!.+d\/s)/i
                ], [MODEL, [VENDOR, HUAWEI], [TYPE, TABLET]], [
                /(?:huawei|honor)([-\w ]+)[;\)]/i,
                /\b(nexus 6p|\w{2,4}e?-[atu]?[ln][\dx][012359c][adn]?)\b(?!.+d\/s)/i
                ], [MODEL, [VENDOR, HUAWEI], [TYPE, MOBILE]], [

                // Xiaomi
                /\b(poco[\w ]+|m2\d{3}j\d\d[a-z]{2})(?: bui|\))/i,                  // Xiaomi POCO
                /\b; (\w+) build\/hm\1/i,                                           // Xiaomi Hongmi 'numeric' models
                /\b(hm[-_ ]?note?[_ ]?(?:\d\w)?) bui/i,                             // Xiaomi Hongmi
                /\b(redmi[\-_ ]?(?:note|k)?[\w_ ]+)(?: bui|\))/i,                   // Xiaomi Redmi
                /oid[^\)]+; (m?[12][0-389][01]\w{3,6}[c-y])( bui|; wv|\))/i,        // Xiaomi Redmi 'numeric' models
                /\b(mi[-_ ]?(?:a\d|one|one[_ ]plus|note lte|max|cc)?[_ ]?(?:\d?\w?)[_ ]?(?:plus|se|lite)?)(?: bui|\))/i // Xiaomi Mi
                ], [[MODEL, /_/g, ' '], [VENDOR, XIAOMI], [TYPE, MOBILE]], [
                /oid[^\)]+; (2\d{4}(283|rpbf)[cgl])( bui|\))/i,                     // Redmi Pad
                /\b(mi[-_ ]?(?:pad)(?:[\w_ ]+))(?: bui|\))/i                        // Mi Pad tablets
                ],[[MODEL, /_/g, ' '], [VENDOR, XIAOMI], [TYPE, TABLET]], [

                // OPPO
                /; (\w+) bui.+ oppo/i,
                /\b(cph[12]\d{3}|p(?:af|c[al]|d\w|e[ar])[mt]\d0|x9007|a101op)\b/i
                ], [MODEL, [VENDOR, 'OPPO'], [TYPE, MOBILE]], [

                // Vivo
                /vivo (\w+)(?: bui|\))/i,
                /\b(v[12]\d{3}\w?[at])(?: bui|;)/i
                ], [MODEL, [VENDOR, 'Vivo'], [TYPE, MOBILE]], [

                // Realme
                /\b(rmx[1-3]\d{3})(?: bui|;|\))/i
                ], [MODEL, [VENDOR, 'Realme'], [TYPE, MOBILE]], [

                // Motorola
                /\b(milestone|droid(?:[2-4x]| (?:bionic|x2|pro|razr))?:?( 4g)?)\b[\w ]+build\//i,
                /\bmot(?:orola)?[- ](\w*)/i,
                /((?:moto[\w\(\) ]+|xt\d{3,4}|nexus 6)(?= bui|\)))/i
                ], [MODEL, [VENDOR, MOTOROLA], [TYPE, MOBILE]], [
                /\b(mz60\d|xoom[2 ]{0,2}) build\//i
                ], [MODEL, [VENDOR, MOTOROLA], [TYPE, TABLET]], [

                // LG
                /((?=lg)?[vl]k\-?\d{3}) bui| 3\.[-\w; ]{10}lg?-([06cv9]{3,4})/i
                ], [MODEL, [VENDOR, LG], [TYPE, TABLET]], [
                /(lm(?:-?f100[nv]?|-[\w\.]+)(?= bui|\))|nexus [45])/i,
                /\blg[-e;\/ ]+((?!browser|netcast|android tv)\w+)/i,
                /\blg-?([\d\w]+) bui/i
                ], [MODEL, [VENDOR, LG], [TYPE, MOBILE]], [

                // Lenovo
                /(ideatab[-\w ]+)/i,
                /lenovo ?(s[56]000[-\w]+|tab(?:[\w ]+)|yt[-\d\w]{6}|tb[-\d\w]{6})/i
                ], [MODEL, [VENDOR, 'Lenovo'], [TYPE, TABLET]], [

                // Nokia
                /(?:maemo|nokia).*(n900|lumia \d+)/i,
                /nokia[-_ ]?([-\w\.]*)/i
                ], [[MODEL, /_/g, ' '], [VENDOR, 'Nokia'], [TYPE, MOBILE]], [

                // Google
                /(pixel c)\b/i                                                      // Google Pixel C
                ], [MODEL, [VENDOR, GOOGLE], [TYPE, TABLET]], [
                /droid.+; (pixel[\daxl ]{0,6})(?: bui|\))/i                         // Google Pixel
                ], [MODEL, [VENDOR, GOOGLE], [TYPE, MOBILE]], [

                // Sony
                /droid.+ (a?\d[0-2]{2}so|[c-g]\d{4}|so[-gl]\w+|xq-a\w[4-7][12])(?= bui|\).+chrome\/(?![1-6]{0,1}\d\.))/i
                ], [MODEL, [VENDOR, SONY], [TYPE, MOBILE]], [
                /sony tablet [ps]/i,
                /\b(?:sony)?sgp\w+(?: bui|\))/i
                ], [[MODEL, 'Xperia Tablet'], [VENDOR, SONY], [TYPE, TABLET]], [

                // OnePlus
                / (kb2005|in20[12]5|be20[12][59])\b/i,
                /(?:one)?(?:plus)? (a\d0\d\d)(?: b|\))/i
                ], [MODEL, [VENDOR, 'OnePlus'], [TYPE, MOBILE]], [

                // Amazon
                /(alexa)webm/i,
                /(kf[a-z]{2}wi|aeo[c-r]{2})( bui|\))/i,                             // Kindle Fire without Silk / Echo Show
                /(kf[a-z]+)( bui|\)).+silk\//i                                      // Kindle Fire HD
                ], [MODEL, [VENDOR, AMAZON], [TYPE, TABLET]], [
                /((?:sd|kf)[0349hijorstuw]+)( bui|\)).+silk\//i                     // Fire Phone
                ], [[MODEL, /(.+)/g, 'Fire Phone $1'], [VENDOR, AMAZON], [TYPE, MOBILE]], [

                // BlackBerry
                /(playbook);[-\w\),; ]+(rim)/i                                      // BlackBerry PlayBook
                ], [MODEL, VENDOR, [TYPE, TABLET]], [
                /\b((?:bb[a-f]|st[hv])100-\d)/i,
                /\(bb10; (\w+)/i                                                    // BlackBerry 10
                ], [MODEL, [VENDOR, BLACKBERRY], [TYPE, MOBILE]], [

                // Asus
                /(?:\b|asus_)(transfo[prime ]{4,10} \w+|eeepc|slider \w+|nexus 7|padfone|p00[cj])/i
                ], [MODEL, [VENDOR, ASUS], [TYPE, TABLET]], [
                / (z[bes]6[027][012][km][ls]|zenfone \d\w?)\b/i
                ], [MODEL, [VENDOR, ASUS], [TYPE, MOBILE]], [

                // HTC
                /(nexus 9)/i                                                        // HTC Nexus 9
                ], [MODEL, [VENDOR, 'HTC'], [TYPE, TABLET]], [
                /(htc)[-;_ ]{1,2}([\w ]+(?=\)| bui)|\w+)/i,                         // HTC

                // ZTE
                /(zte)[- ]([\w ]+?)(?: bui|\/|\))/i,
                /(alcatel|geeksphone|nexian|panasonic(?!(?:;|\.))|sony(?!-bra))[-_ ]?([-\w]*)/i         // Alcatel/GeeksPhone/Nexian/Panasonic/Sony
                ], [VENDOR, [MODEL, /_/g, ' '], [TYPE, MOBILE]], [

                // Acer
                /droid.+; ([ab][1-7]-?[0178a]\d\d?)/i
                ], [MODEL, [VENDOR, 'Acer'], [TYPE, TABLET]], [

                // Meizu
                /droid.+; (m[1-5] note) bui/i,
                /\bmz-([-\w]{2,})/i
                ], [MODEL, [VENDOR, 'Meizu'], [TYPE, MOBILE]], [
                    
                // Ulefone
                /; ((?:power )?armor(?:[\w ]{0,8}))(?: bui|\))/i
                ], [MODEL, [VENDOR, 'Ulefone'], [TYPE, MOBILE]], [

                // MIXED
                /(blackberry|benq|palm(?=\-)|sonyericsson|acer|asus|dell|meizu|motorola|polytron|infinix|tecno)[-_ ]?([-\w]*)/i,
                                                                                    // BlackBerry/BenQ/Palm/Sony-Ericsson/Acer/Asus/Dell/Meizu/Motorola/Polytron
                /(hp) ([\w ]+\w)/i,                                                 // HP iPAQ
                /(asus)-?(\w+)/i,                                                   // Asus
                /(microsoft); (lumia[\w ]+)/i,                                      // Microsoft Lumia
                /(lenovo)[-_ ]?([-\w]+)/i,                                          // Lenovo
                /(jolla)/i,                                                         // Jolla
                /(oppo) ?([\w ]+) bui/i                                             // OPPO
                ], [VENDOR, MODEL, [TYPE, MOBILE]], [

                /(kobo)\s(ereader|touch)/i,                                         // Kobo
                /(archos) (gamepad2?)/i,                                            // Archos
                /(hp).+(touchpad(?!.+tablet)|tablet)/i,                             // HP TouchPad
                /(kindle)\/([\w\.]+)/i,                                             // Kindle
                /(nook)[\w ]+build\/(\w+)/i,                                        // Nook
                /(dell) (strea[kpr\d ]*[\dko])/i,                                   // Dell Streak
                /(le[- ]+pan)[- ]+(\w{1,9}) bui/i,                                  // Le Pan Tablets
                /(trinity)[- ]*(t\d{3}) bui/i,                                      // Trinity Tablets
                /(gigaset)[- ]+(q\w{1,9}) bui/i,                                    // Gigaset Tablets
                /(vodafone) ([\w ]+)(?:\)| bui)/i                                   // Vodafone
                ], [VENDOR, MODEL, [TYPE, TABLET]], [

                /(surface duo)/i                                                    // Surface Duo
                ], [MODEL, [VENDOR, MICROSOFT], [TYPE, TABLET]], [
                /droid [\d\.]+; (fp\du?)(?: b|\))/i                                 // Fairphone
                ], [MODEL, [VENDOR, 'Fairphone'], [TYPE, MOBILE]], [
                /(u304aa)/i                                                         // AT&T
                ], [MODEL, [VENDOR, 'AT&T'], [TYPE, MOBILE]], [
                /\bsie-(\w*)/i                                                      // Siemens
                ], [MODEL, [VENDOR, 'Siemens'], [TYPE, MOBILE]], [
                /\b(rct\w+) b/i                                                     // RCA Tablets
                ], [MODEL, [VENDOR, 'RCA'], [TYPE, TABLET]], [
                /\b(venue[\d ]{2,7}) b/i                                            // Dell Venue Tablets
                ], [MODEL, [VENDOR, 'Dell'], [TYPE, TABLET]], [
                /\b(q(?:mv|ta)\w+) b/i                                              // Verizon Tablet
                ], [MODEL, [VENDOR, 'Verizon'], [TYPE, TABLET]], [
                /\b(?:barnes[& ]+noble |bn[rt])([\w\+ ]*) b/i                       // Barnes & Noble Tablet
                ], [MODEL, [VENDOR, 'Barnes & Noble'], [TYPE, TABLET]], [
                /\b(tm\d{3}\w+) b/i
                ], [MODEL, [VENDOR, 'NuVision'], [TYPE, TABLET]], [
                /\b(k88) b/i                                                        // ZTE K Series Tablet
                ], [MODEL, [VENDOR, 'ZTE'], [TYPE, TABLET]], [
                /\b(nx\d{3}j) b/i                                                   // ZTE Nubia
                ], [MODEL, [VENDOR, 'ZTE'], [TYPE, MOBILE]], [
                /\b(gen\d{3}) b.+49h/i                                              // Swiss GEN Mobile
                ], [MODEL, [VENDOR, 'Swiss'], [TYPE, MOBILE]], [
                /\b(zur\d{3}) b/i                                                   // Swiss ZUR Tablet
                ], [MODEL, [VENDOR, 'Swiss'], [TYPE, TABLET]], [
                /\b((zeki)?tb.*\b) b/i                                              // Zeki Tablets
                ], [MODEL, [VENDOR, 'Zeki'], [TYPE, TABLET]], [
                /\b([yr]\d{2}) b/i,
                /\b(dragon[- ]+touch |dt)(\w{5}) b/i                                // Dragon Touch Tablet
                ], [[VENDOR, 'Dragon Touch'], MODEL, [TYPE, TABLET]], [
                /\b(ns-?\w{0,9}) b/i                                                // Insignia Tablets
                ], [MODEL, [VENDOR, 'Insignia'], [TYPE, TABLET]], [
                /\b((nxa|next)-?\w{0,9}) b/i                                        // NextBook Tablets
                ], [MODEL, [VENDOR, 'NextBook'], [TYPE, TABLET]], [
                /\b(xtreme\_)?(v(1[045]|2[015]|[3469]0|7[05])) b/i                  // Voice Xtreme Phones
                ], [[VENDOR, 'Voice'], MODEL, [TYPE, MOBILE]], [
                /\b(lvtel\-)?(v1[12]) b/i                                           // LvTel Phones
                ], [[VENDOR, 'LvTel'], MODEL, [TYPE, MOBILE]], [
                /\b(ph-1) /i                                                        // Essential PH-1
                ], [MODEL, [VENDOR, 'Essential'], [TYPE, MOBILE]], [
                /\b(v(100md|700na|7011|917g).*\b) b/i                               // Envizen Tablets
                ], [MODEL, [VENDOR, 'Envizen'], [TYPE, TABLET]], [
                /\b(trio[-\w\. ]+) b/i                                              // MachSpeed Tablets
                ], [MODEL, [VENDOR, 'MachSpeed'], [TYPE, TABLET]], [
                /\btu_(1491) b/i                                                    // Rotor Tablets
                ], [MODEL, [VENDOR, 'Rotor'], [TYPE, TABLET]], [
                /(shield[\w ]+) b/i                                                 // Nvidia Shield Tablets
                ], [MODEL, [VENDOR, 'Nvidia'], [TYPE, TABLET]], [
                /(sprint) (\w+)/i                                                   // Sprint Phones
                ], [VENDOR, MODEL, [TYPE, MOBILE]], [
                /(kin\.[onetw]{3})/i                                                // Microsoft Kin
                ], [[MODEL, /\./g, ' '], [VENDOR, MICROSOFT], [TYPE, MOBILE]], [
                /droid.+; (cc6666?|et5[16]|mc[239][23]x?|vc8[03]x?)\)/i             // Zebra
                ], [MODEL, [VENDOR, ZEBRA], [TYPE, TABLET]], [
                /droid.+; (ec30|ps20|tc[2-8]\d[kx])\)/i
                ], [MODEL, [VENDOR, ZEBRA], [TYPE, MOBILE]], [

                ///////////////////
                // SMARTTVS
                ///////////////////

                /smart-tv.+(samsung)/i                                              // Samsung
                ], [VENDOR, [TYPE, SMARTTV]], [
                /hbbtv.+maple;(\d+)/i
                ], [[MODEL, /^/, 'SmartTV'], [VENDOR, SAMSUNG], [TYPE, SMARTTV]], [
                /(nux; netcast.+smarttv|lg (netcast\.tv-201\d|android tv))/i        // LG SmartTV
                ], [[VENDOR, LG], [TYPE, SMARTTV]], [
                /(apple) ?tv/i                                                      // Apple TV
                ], [VENDOR, [MODEL, APPLE+' TV'], [TYPE, SMARTTV]], [
                /crkey/i                                                            // Google Chromecast
                ], [[MODEL, CHROME+'cast'], [VENDOR, GOOGLE], [TYPE, SMARTTV]], [
                /droid.+aft(\w+)( bui|\))/i                                         // Fire TV
                ], [MODEL, [VENDOR, AMAZON], [TYPE, SMARTTV]], [
                /\(dtv[\);].+(aquos)/i,
                /(aquos-tv[\w ]+)\)/i                                               // Sharp
                ], [MODEL, [VENDOR, SHARP], [TYPE, SMARTTV]],[
                /(bravia[\w ]+)( bui|\))/i                                              // Sony
                ], [MODEL, [VENDOR, SONY], [TYPE, SMARTTV]], [
                /(mitv-\w{5}) bui/i                                                 // Xiaomi
                ], [MODEL, [VENDOR, XIAOMI], [TYPE, SMARTTV]], [
                /Hbbtv.*(technisat) (.*);/i                                         // TechniSAT
                ], [VENDOR, MODEL, [TYPE, SMARTTV]], [
                /\b(roku)[\dx]*[\)\/]((?:dvp-)?[\d\.]*)/i,                          // Roku
                /hbbtv\/\d+\.\d+\.\d+ +\([\w\+ ]*; *([\w\d][^;]*);([^;]*)/i         // HbbTV devices
                ], [[VENDOR, trim], [MODEL, trim], [TYPE, SMARTTV]], [
                /\b(android tv|smart[- ]?tv|opera tv|tv; rv:)\b/i                   // SmartTV from Unidentified Vendors
                ], [[TYPE, SMARTTV]], [

                ///////////////////
                // CONSOLES
                ///////////////////

                /(ouya)/i,                                                          // Ouya
                /(nintendo) ([wids3utch]+)/i                                        // Nintendo
                ], [VENDOR, MODEL, [TYPE, CONSOLE]], [
                /droid.+; (shield) bui/i                                            // Nvidia
                ], [MODEL, [VENDOR, 'Nvidia'], [TYPE, CONSOLE]], [
                /(playstation [345portablevi]+)/i                                   // Playstation
                ], [MODEL, [VENDOR, SONY], [TYPE, CONSOLE]], [
                /\b(xbox(?: one)?(?!; xbox))[\); ]/i                                // Microsoft Xbox
                ], [MODEL, [VENDOR, MICROSOFT], [TYPE, CONSOLE]], [

                ///////////////////
                // WEARABLES
                ///////////////////

                /((pebble))app/i                                                    // Pebble
                ], [VENDOR, MODEL, [TYPE, WEARABLE]], [
                /(watch)(?: ?os[,\/]|\d,\d\/)[\d\.]+/i                              // Apple Watch
                ], [MODEL, [VENDOR, APPLE], [TYPE, WEARABLE]], [
                /droid.+; (glass) \d/i                                              // Google Glass
                ], [MODEL, [VENDOR, GOOGLE], [TYPE, WEARABLE]], [
                /droid.+; (wt63?0{2,3})\)/i
                ], [MODEL, [VENDOR, ZEBRA], [TYPE, WEARABLE]], [
                /(quest( 2| pro)?)/i                                                // Oculus Quest
                ], [MODEL, [VENDOR, FACEBOOK], [TYPE, WEARABLE]], [

                ///////////////////
                // EMBEDDED
                ///////////////////

                /(tesla)(?: qtcarbrowser|\/[-\w\.]+)/i                              // Tesla
                ], [VENDOR, [TYPE, EMBEDDED]], [
                /(aeobc)\b/i                                                        // Echo Dot
                ], [MODEL, [VENDOR, AMAZON], [TYPE, EMBEDDED]], [

                ////////////////////
                // MIXED (GENERIC)
                ///////////////////

                /droid .+?; ([^;]+?)(?: bui|; wv\)|\) applew).+? mobile safari/i    // Android Phones from Unidentified Vendors
                ], [MODEL, [TYPE, MOBILE]], [
                /droid .+?; ([^;]+?)(?: bui|\) applew).+?(?! mobile) safari/i       // Android Tablets from Unidentified Vendors
                ], [MODEL, [TYPE, TABLET]], [
                /\b((tablet|tab)[;\/]|focus\/\d(?!.+mobile))/i                      // Unidentifiable Tablet
                ], [[TYPE, TABLET]], [
                /(phone|mobile(?:[;\/]| [ \w\/\.]*safari)|pda(?=.+windows ce))/i    // Unidentifiable Mobile
                ], [[TYPE, MOBILE]], [
                /(android[-\w\. ]{0,9});.+buil/i                                    // Generic Android Device
                ], [MODEL, [VENDOR, 'Generic']]
            ],

            engine : [[

                /windows.+ edge\/([\w\.]+)/i                                       // EdgeHTML
                ], [VERSION, [NAME, EDGE+'HTML']], [

                /webkit\/537\.36.+chrome\/(?!27)([\w\.]+)/i                         // Blink
                ], [VERSION, [NAME, 'Blink']], [

                /(presto)\/([\w\.]+)/i,                                             // Presto
                /(webkit|trident|netfront|netsurf|amaya|lynx|w3m|goanna)\/([\w\.]+)/i, // WebKit/Trident/NetFront/NetSurf/Amaya/Lynx/w3m/Goanna
                /ekioh(flow)\/([\w\.]+)/i,                                          // Flow
                /(khtml|tasman|links)[\/ ]\(?([\w\.]+)/i,                           // KHTML/Tasman/Links
                /(icab)[\/ ]([23]\.[\d\.]+)/i,                                      // iCab
                /\b(libweb)/i
                ], [NAME, VERSION], [

                /rv\:([\w\.]{1,9})\b.+(gecko)/i                                     // Gecko
                ], [VERSION, NAME]
            ],

            os : [[

                // Windows
                /microsoft (windows) (vista|xp)/i                                   // Windows (iTunes)
                ], [NAME, VERSION], [
                /(windows (?:phone(?: os)?|mobile))[\/ ]?([\d\.\w ]*)/i             // Windows Phone
                ], [NAME, [VERSION, strMapper, windowsVersionMap]], [
                /windows nt 6\.2; (arm)/i,                                        // Windows RT
                /windows[\/ ]?([ntce\d\. ]+\w)(?!.+xbox)/i,
                /(?:win(?=3|9|n)|win 9x )([nt\d\.]+)/i
                ], [[VERSION, strMapper, windowsVersionMap], [NAME, 'Windows']], [

                // iOS/macOS
                /ip[honead]{2,4}\b(?:.*os ([\w]+) like mac|; opera)/i,              // iOS
                /(?:ios;fbsv\/|iphone.+ios[\/ ])([\d\.]+)/i,
                /cfnetwork\/.+darwin/i
                ], [[VERSION, /_/g, '.'], [NAME, 'iOS']], [
                /(mac os x) ?([\w\. ]*)/i,
                /(macintosh|mac_powerpc\b)(?!.+haiku)/i                             // Mac OS
                ], [[NAME, MAC_OS], [VERSION, /_/g, '.']], [

                // Mobile OSes
                /droid ([\w\.]+)\b.+(android[- ]x86|harmonyos)/i                    // Android-x86/HarmonyOS
                ], [VERSION, NAME], [                                               // Android/WebOS/QNX/Bada/RIM/Maemo/MeeGo/Sailfish OS
                /(android|webos|qnx|bada|rim tablet os|maemo|meego|sailfish)[-\/ ]?([\w\.]*)/i,
                /(blackberry)\w*\/([\w\.]*)/i,                                      // Blackberry
                /(tizen|kaios)[\/ ]([\w\.]+)/i,                                     // Tizen/KaiOS
                /\((series40);/i                                                    // Series 40
                ], [NAME, VERSION], [
                /\(bb(10);/i                                                        // BlackBerry 10
                ], [VERSION, [NAME, BLACKBERRY]], [
                /(?:symbian ?os|symbos|s60(?=;)|series60)[-\/ ]?([\w\.]*)/i         // Symbian
                ], [VERSION, [NAME, 'Symbian']], [
                /mozilla\/[\d\.]+ \((?:mobile|tablet|tv|mobile; [\w ]+); rv:.+ gecko\/([\w\.]+)/i // Firefox OS
                ], [VERSION, [NAME, FIREFOX+' OS']], [
                /web0s;.+rt(tv)/i,
                /\b(?:hp)?wos(?:browser)?\/([\w\.]+)/i                              // WebOS
                ], [VERSION, [NAME, 'webOS']], [
                /watch(?: ?os[,\/]|\d,\d\/)([\d\.]+)/i                              // watchOS
                ], [VERSION, [NAME, 'watchOS']], [

                // Google Chromecast
                /crkey\/([\d\.]+)/i                                                 // Google Chromecast
                ], [VERSION, [NAME, CHROME+'cast']], [
                /(cros) [\w]+(?:\)| ([\w\.]+)\b)/i                                  // Chromium OS
                ], [[NAME, CHROMIUM_OS], VERSION],[

                // Smart TVs
                /panasonic;(viera)/i,                                               // Panasonic Viera
                /(netrange)mmh/i,                                                   // Netrange
                /(nettv)\/(\d+\.[\w\.]+)/i,                                         // NetTV

                // Console
                /(nintendo|playstation) ([wids345portablevuch]+)/i,                 // Nintendo/Playstation
                /(xbox); +xbox ([^\);]+)/i,                                         // Microsoft Xbox (360, One, X, S, Series X, Series S)

                // Other
                /\b(joli|palm)\b ?(?:os)?\/?([\w\.]*)/i,                            // Joli/Palm
                /(mint)[\/\(\) ]?(\w*)/i,                                           // Mint
                /(mageia|vectorlinux)[; ]/i,                                        // Mageia/VectorLinux
                /([kxln]?ubuntu|debian|suse|opensuse|gentoo|arch(?= linux)|slackware|fedora|mandriva|centos|pclinuxos|red ?hat|zenwalk|linpus|raspbian|plan 9|minix|risc os|contiki|deepin|manjaro|elementary os|sabayon|linspire)(?: gnu\/linux)?(?: enterprise)?(?:[- ]linux)?(?:-gnu)?[-\/ ]?(?!chrom|package)([-\w\.]*)/i,
                                                                                    // Ubuntu/Debian/SUSE/Gentoo/Arch/Slackware/Fedora/Mandriva/CentOS/PCLinuxOS/RedHat/Zenwalk/Linpus/Raspbian/Plan9/Minix/RISCOS/Contiki/Deepin/Manjaro/elementary/Sabayon/Linspire
                /(hurd|linux) ?([\w\.]*)/i,                                         // Hurd/Linux
                /(gnu) ?([\w\.]*)/i,                                                // GNU
                /\b([-frentopcghs]{0,5}bsd|dragonfly)[\/ ]?(?!amd|[ix346]{1,2}86)([\w\.]*)/i, // FreeBSD/NetBSD/OpenBSD/PC-BSD/GhostBSD/DragonFly
                /(haiku) (\w+)/i                                                    // Haiku
                ], [NAME, VERSION], [
                /(sunos) ?([\w\.\d]*)/i                                             // Solaris
                ], [[NAME, 'Solaris'], VERSION], [
                /((?:open)?solaris)[-\/ ]?([\w\.]*)/i,                              // Solaris
                /(aix) ((\d)(?=\.|\)| )[\w\.])*/i,                                  // AIX
                /\b(beos|os\/2|amigaos|morphos|openvms|fuchsia|hp-ux|serenityos)/i, // BeOS/OS2/AmigaOS/MorphOS/OpenVMS/Fuchsia/HP-UX/SerenityOS
                /(unix) ?([\w\.]*)/i                                                // UNIX
                ], [NAME, VERSION]
            ]
        };

        /////////////////
        // Constructor
        ////////////////

        var UAParser = function (ua, extensions) {

            if (typeof ua === OBJ_TYPE) {
                extensions = ua;
                ua = undefined$1;
            }

            if (!(this instanceof UAParser)) {
                return new UAParser(ua, extensions).getResult();
            }

            var _navigator = (typeof window !== UNDEF_TYPE && window.navigator) ? window.navigator : undefined$1;
            var _ua = ua || ((_navigator && _navigator.userAgent) ? _navigator.userAgent : EMPTY);
            var _uach = (_navigator && _navigator.userAgentData) ? _navigator.userAgentData : undefined$1;
            var _rgxmap = extensions ? extend(regexes, extensions) : regexes;
            var _isSelfNav = _navigator && _navigator.userAgent == _ua;

            this.getBrowser = function () {
                var _browser = {};
                _browser[NAME] = undefined$1;
                _browser[VERSION] = undefined$1;
                rgxMapper.call(_browser, _ua, _rgxmap.browser);
                _browser[MAJOR] = majorize(_browser[VERSION]);
                // Brave-specific detection
                if (_isSelfNav && _navigator && _navigator.brave && typeof _navigator.brave.isBrave == FUNC_TYPE) {
                    _browser[NAME] = 'Brave';
                }
                return _browser;
            };
            this.getCPU = function () {
                var _cpu = {};
                _cpu[ARCHITECTURE] = undefined$1;
                rgxMapper.call(_cpu, _ua, _rgxmap.cpu);
                return _cpu;
            };
            this.getDevice = function () {
                var _device = {};
                _device[VENDOR] = undefined$1;
                _device[MODEL] = undefined$1;
                _device[TYPE] = undefined$1;
                rgxMapper.call(_device, _ua, _rgxmap.device);
                if (_isSelfNav && !_device[TYPE] && _uach && _uach.mobile) {
                    _device[TYPE] = MOBILE;
                }
                // iPadOS-specific detection: identified as Mac, but has some iOS-only properties
                if (_isSelfNav && _device[MODEL] == 'Macintosh' && _navigator && typeof _navigator.standalone !== UNDEF_TYPE && _navigator.maxTouchPoints && _navigator.maxTouchPoints > 2) {
                    _device[MODEL] = 'iPad';
                    _device[TYPE] = TABLET;
                }
                return _device;
            };
            this.getEngine = function () {
                var _engine = {};
                _engine[NAME] = undefined$1;
                _engine[VERSION] = undefined$1;
                rgxMapper.call(_engine, _ua, _rgxmap.engine);
                return _engine;
            };
            this.getOS = function () {
                var _os = {};
                _os[NAME] = undefined$1;
                _os[VERSION] = undefined$1;
                rgxMapper.call(_os, _ua, _rgxmap.os);
                if (_isSelfNav && !_os[NAME] && _uach && _uach.platform != 'Unknown') {
                    _os[NAME] = _uach.platform  
                                        .replace(/chrome os/i, CHROMIUM_OS)
                                        .replace(/macos/i, MAC_OS);           // backward compatibility
                }
                return _os;
            };
            this.getResult = function () {
                return {
                    ua      : this.getUA(),
                    browser : this.getBrowser(),
                    engine  : this.getEngine(),
                    os      : this.getOS(),
                    device  : this.getDevice(),
                    cpu     : this.getCPU()
                };
            };
            this.getUA = function () {
                return _ua;
            };
            this.setUA = function (ua) {
                _ua = (typeof ua === STR_TYPE && ua.length > UA_MAX_LENGTH) ? trim(ua, UA_MAX_LENGTH) : ua;
                return this;
            };
            this.setUA(_ua);
            return this;
        };

        UAParser.VERSION = LIBVERSION;
        UAParser.BROWSER =  enumerize([NAME, VERSION, MAJOR]);
        UAParser.CPU = enumerize([ARCHITECTURE]);
        UAParser.DEVICE = enumerize([MODEL, VENDOR, TYPE, CONSOLE, MOBILE, SMARTTV, TABLET, WEARABLE, EMBEDDED]);
        UAParser.ENGINE = UAParser.OS = enumerize([NAME, VERSION]);

        ///////////
        // Export
        //////////

        // check js environment
        {
            // nodejs env
            if (module.exports) {
                exports = module.exports = UAParser;
            }
            exports.UAParser = UAParser;
        }

        // jQuery/Zepto specific (optional)
        // Note:
        //   In AMD env the global scope should be kept clean, but jQuery is an exception.
        //   jQuery always exports to global scope, unless jQuery.noConflict(true) is used,
        //   and we should catch that.
        var $ = typeof window !== UNDEF_TYPE && (window.jQuery || window.Zepto);
        if ($ && !$.ua) {
            var parser = new UAParser();
            $.ua = parser.getResult();
            $.ua.get = function () {
                return parser.getUA();
            };
            $.ua.set = function (ua) {
                parser.setUA(ua);
                var result = parser.getResult();
                for (var prop in result) {
                    $.ua[prop] = result[prop];
                }
            };
        }

    })(typeof window === 'object' ? window : commonjsGlobal);
    });
    uaParser.UAParser;

    // NOTE: this list must be up-to-date with browsers listed in
    // test/acceptance/useragentstrings.yml
    const BROWSER_ALIASES_MAP = {
      'Amazon Silk': 'amazon_silk',
      'Android Browser': 'android',
      Bada: 'bada',
      BlackBerry: 'blackberry',
      Chrome: 'chrome',
      Chromium: 'chromium',
      Electron: 'electron',
      Epiphany: 'epiphany',
      Firefox: 'firefox',
      Focus: 'focus',
      Generic: 'generic',
      'Google Search': 'google_search',
      Googlebot: 'googlebot',
      'Internet Explorer': 'ie',
      'K-Meleon': 'k_meleon',
      Maxthon: 'maxthon',
      'Microsoft Edge': 'edge',
      'MZ Browser': 'mz',
      'NAVER Whale Browser': 'naver',
      Opera: 'opera',
      'Opera Coast': 'opera_coast',
      PhantomJS: 'phantomjs',
      Puffin: 'puffin',
      QupZilla: 'qupzilla',
      QQ: 'qq',
      QQLite: 'qqlite',
      Safari: 'safari',
      Sailfish: 'sailfish',
      'Samsung Internet for Android': 'samsung_internet',
      SeaMonkey: 'seamonkey',
      Sleipnir: 'sleipnir',
      Swing: 'swing',
      Tizen: 'tizen',
      'UC Browser': 'uc',
      Vivaldi: 'vivaldi',
      'WebOS Browser': 'webos',
      WeChat: 'wechat',
      'Yandex Browser': 'yandex',
      Roku: 'roku',
    };

    const BROWSER_MAP = {
      amazon_silk: 'Amazon Silk',
      android: 'Android Browser',
      bada: 'Bada',
      blackberry: 'BlackBerry',
      chrome: 'Chrome',
      chromium: 'Chromium',
      electron: 'Electron',
      epiphany: 'Epiphany',
      firefox: 'Firefox',
      focus: 'Focus',
      generic: 'Generic',
      googlebot: 'Googlebot',
      google_search: 'Google Search',
      ie: 'Internet Explorer',
      k_meleon: 'K-Meleon',
      maxthon: 'Maxthon',
      edge: 'Microsoft Edge',
      mz: 'MZ Browser',
      naver: 'NAVER Whale Browser',
      opera: 'Opera',
      opera_coast: 'Opera Coast',
      phantomjs: 'PhantomJS',
      puffin: 'Puffin',
      qupzilla: 'QupZilla',
      qq: 'QQ Browser',
      qqlite: 'QQ Browser Lite',
      safari: 'Safari',
      sailfish: 'Sailfish',
      samsung_internet: 'Samsung Internet for Android',
      seamonkey: 'SeaMonkey',
      sleipnir: 'Sleipnir',
      swing: 'Swing',
      tizen: 'Tizen',
      uc: 'UC Browser',
      vivaldi: 'Vivaldi',
      webos: 'WebOS Browser',
      wechat: 'WeChat',
      yandex: 'Yandex Browser',
    };

    const PLATFORMS_MAP = {
      tablet: 'tablet',
      mobile: 'mobile',
      desktop: 'desktop',
      tv: 'tv',
    };

    const OS_MAP = {
      WindowsPhone: 'Windows Phone',
      Windows: 'Windows',
      MacOS: 'macOS',
      iOS: 'iOS',
      Android: 'Android',
      WebOS: 'WebOS',
      BlackBerry: 'BlackBerry',
      Bada: 'Bada',
      Tizen: 'Tizen',
      Linux: 'Linux',
      ChromeOS: 'Chrome OS',
      PlayStation4: 'PlayStation 4',
      Roku: 'Roku',
    };

    const ENGINE_MAP = {
      EdgeHTML: 'EdgeHTML',
      Blink: 'Blink',
      Trident: 'Trident',
      Presto: 'Presto',
      Gecko: 'Gecko',
      WebKit: 'WebKit',
    };

    class Utils {
      /**
       * Get first matched item for a string
       * @param {RegExp} regexp
       * @param {String} ua
       * @return {Array|{index: number, input: string}|*|boolean|string}
       */
      static getFirstMatch(regexp, ua) {
        const match = ua.match(regexp);
        return (match && match.length > 0 && match[1]) || '';
      }

      /**
       * Get second matched item for a string
       * @param regexp
       * @param {String} ua
       * @return {Array|{index: number, input: string}|*|boolean|string}
       */
      static getSecondMatch(regexp, ua) {
        const match = ua.match(regexp);
        return (match && match.length > 1 && match[2]) || '';
      }

      /**
       * Match a regexp and return a constant or undefined
       * @param {RegExp} regexp
       * @param {String} ua
       * @param {*} _const Any const that will be returned if regexp matches the string
       * @return {*}
       */
      static matchAndReturnConst(regexp, ua, _const) {
        if (regexp.test(ua)) {
          return _const;
        }
        return void (0);
      }

      static getWindowsVersionName(version) {
        switch (version) {
          case 'NT': return 'NT';
          case 'XP': return 'XP';
          case 'NT 5.0': return '2000';
          case 'NT 5.1': return 'XP';
          case 'NT 5.2': return '2003';
          case 'NT 6.0': return 'Vista';
          case 'NT 6.1': return '7';
          case 'NT 6.2': return '8';
          case 'NT 6.3': return '8.1';
          case 'NT 10.0': return '10';
          default: return undefined;
        }
      }

      /**
       * Get macOS version name
       *    10.5 - Leopard
       *    10.6 - Snow Leopard
       *    10.7 - Lion
       *    10.8 - Mountain Lion
       *    10.9 - Mavericks
       *    10.10 - Yosemite
       *    10.11 - El Capitan
       *    10.12 - Sierra
       *    10.13 - High Sierra
       *    10.14 - Mojave
       *    10.15 - Catalina
       *
       * @example
       *   getMacOSVersionName("10.14") // 'Mojave'
       *
       * @param  {string} version
       * @return {string} versionName
       */
      static getMacOSVersionName(version) {
        const v = version.split('.').splice(0, 2).map(s => parseInt(s, 10) || 0);
        v.push(0);
        if (v[0] !== 10) return undefined;
        switch (v[1]) {
          case 5: return 'Leopard';
          case 6: return 'Snow Leopard';
          case 7: return 'Lion';
          case 8: return 'Mountain Lion';
          case 9: return 'Mavericks';
          case 10: return 'Yosemite';
          case 11: return 'El Capitan';
          case 12: return 'Sierra';
          case 13: return 'High Sierra';
          case 14: return 'Mojave';
          case 15: return 'Catalina';
          default: return undefined;
        }
      }

      /**
       * Get Android version name
       *    1.5 - Cupcake
       *    1.6 - Donut
       *    2.0 - Eclair
       *    2.1 - Eclair
       *    2.2 - Froyo
       *    2.x - Gingerbread
       *    3.x - Honeycomb
       *    4.0 - Ice Cream Sandwich
       *    4.1 - Jelly Bean
       *    4.4 - KitKat
       *    5.x - Lollipop
       *    6.x - Marshmallow
       *    7.x - Nougat
       *    8.x - Oreo
       *    9.x - Pie
       *
       * @example
       *   getAndroidVersionName("7.0") // 'Nougat'
       *
       * @param  {string} version
       * @return {string} versionName
       */
      static getAndroidVersionName(version) {
        const v = version.split('.').splice(0, 2).map(s => parseInt(s, 10) || 0);
        v.push(0);
        if (v[0] === 1 && v[1] < 5) return undefined;
        if (v[0] === 1 && v[1] < 6) return 'Cupcake';
        if (v[0] === 1 && v[1] >= 6) return 'Donut';
        if (v[0] === 2 && v[1] < 2) return 'Eclair';
        if (v[0] === 2 && v[1] === 2) return 'Froyo';
        if (v[0] === 2 && v[1] > 2) return 'Gingerbread';
        if (v[0] === 3) return 'Honeycomb';
        if (v[0] === 4 && v[1] < 1) return 'Ice Cream Sandwich';
        if (v[0] === 4 && v[1] < 4) return 'Jelly Bean';
        if (v[0] === 4 && v[1] >= 4) return 'KitKat';
        if (v[0] === 5) return 'Lollipop';
        if (v[0] === 6) return 'Marshmallow';
        if (v[0] === 7) return 'Nougat';
        if (v[0] === 8) return 'Oreo';
        if (v[0] === 9) return 'Pie';
        return undefined;
      }

      /**
       * Get version precisions count
       *
       * @example
       *   getVersionPrecision("1.10.3") // 3
       *
       * @param  {string} version
       * @return {number}
       */
      static getVersionPrecision(version) {
        return version.split('.').length;
      }

      /**
       * Calculate browser version weight
       *
       * @example
       *   compareVersions('1.10.2.1',  '1.8.2.1.90')    // 1
       *   compareVersions('1.010.2.1', '1.09.2.1.90');  // 1
       *   compareVersions('1.10.2.1',  '1.10.2.1');     // 0
       *   compareVersions('1.10.2.1',  '1.0800.2');     // -1
       *   compareVersions('1.10.2.1',  '1.10',  true);  // 0
       *
       * @param {String} versionA versions versions to compare
       * @param {String} versionB versions versions to compare
       * @param {boolean} [isLoose] enable loose comparison
       * @return {Number} comparison result: -1 when versionA is lower,
       * 1 when versionA is bigger, 0 when both equal
       */
      /* eslint consistent-return: 1 */
      static compareVersions(versionA, versionB, isLoose = false) {
        // 1) get common precision for both versions, for example for "10.0" and "9" it should be 2
        const versionAPrecision = Utils.getVersionPrecision(versionA);
        const versionBPrecision = Utils.getVersionPrecision(versionB);

        let precision = Math.max(versionAPrecision, versionBPrecision);
        let lastPrecision = 0;

        const chunks = Utils.map([versionA, versionB], (version) => {
          const delta = precision - Utils.getVersionPrecision(version);

          // 2) "9" -> "9.0" (for precision = 2)
          const _version = version + new Array(delta + 1).join('.0');

          // 3) "9.0" -> ["000000000"", "000000009"]
          return Utils.map(_version.split('.'), chunk => new Array(20 - chunk.length).join('0') + chunk).reverse();
        });

        // adjust precision for loose comparison
        if (isLoose) {
          lastPrecision = precision - Math.min(versionAPrecision, versionBPrecision);
        }

        // iterate in reverse order by reversed chunks array
        precision -= 1;
        while (precision >= lastPrecision) {
          // 4) compare: "000000009" > "000000010" = false (but "9" > "10" = true)
          if (chunks[0][precision] > chunks[1][precision]) {
            return 1;
          }

          if (chunks[0][precision] === chunks[1][precision]) {
            if (precision === lastPrecision) {
              // all version chunks are same
              return 0;
            }

            precision -= 1;
          } else if (chunks[0][precision] < chunks[1][precision]) {
            return -1;
          }
        }

        return undefined;
      }

      /**
       * Array::map polyfill
       *
       * @param  {Array} arr
       * @param  {Function} iterator
       * @return {Array}
       */
      static map(arr, iterator) {
        const result = [];
        let i;
        if (Array.prototype.map) {
          return Array.prototype.map.call(arr, iterator);
        }
        for (i = 0; i < arr.length; i += 1) {
          result.push(iterator(arr[i]));
        }
        return result;
      }

      /**
       * Array::find polyfill
       *
       * @param  {Array} arr
       * @param  {Function} predicate
       * @return {Array}
       */
      static find(arr, predicate) {
        let i;
        let l;
        if (Array.prototype.find) {
          return Array.prototype.find.call(arr, predicate);
        }
        for (i = 0, l = arr.length; i < l; i += 1) {
          const value = arr[i];
          if (predicate(value, i)) {
            return value;
          }
        }
        return undefined;
      }

      /**
       * Object::assign polyfill
       *
       * @param  {Object} obj
       * @param  {Object} ...objs
       * @return {Object}
       */
      static assign(obj, ...assigners) {
        const result = obj;
        let i;
        let l;
        if (Object.assign) {
          return Object.assign(obj, ...assigners);
        }
        for (i = 0, l = assigners.length; i < l; i += 1) {
          const assigner = assigners[i];
          if (typeof assigner === 'object' && assigner !== null) {
            const keys = Object.keys(assigner);
            keys.forEach((key) => {
              result[key] = assigner[key];
            });
          }
        }
        return obj;
      }

      /**
       * Get short version/alias for a browser name
       *
       * @example
       *   getBrowserAlias('Microsoft Edge') // edge
       *
       * @param  {string} browserName
       * @return {string}
       */
      static getBrowserAlias(browserName) {
        return BROWSER_ALIASES_MAP[browserName];
      }

      /**
       * Get short version/alias for a browser name
       *
       * @example
       *   getBrowserAlias('edge') // Microsoft Edge
       *
       * @param  {string} browserAlias
       * @return {string}
       */
      static getBrowserTypeByAlias(browserAlias) {
        return BROWSER_MAP[browserAlias] || '';
      }
    }

    /**
     * Browsers' descriptors
     *
     * The idea of descriptors is simple. You should know about them two simple things:
     * 1. Every descriptor has a method or property called `test` and a `describe` method.
     * 2. Order of descriptors is important.
     *
     * More details:
     * 1. Method or property `test` serves as a way to detect whether the UA string
     * matches some certain browser or not. The `describe` method helps to make a result
     * object with params that show some browser-specific things: name, version, etc.
     * 2. Order of descriptors is important because a Parser goes through them one by one
     * in course. For example, if you insert Chrome's descriptor as the first one,
     * more then a half of browsers will be described as Chrome, because they will pass
     * the Chrome descriptor's test.
     *
     * Descriptor's `test` could be a property with an array of RegExps, where every RegExp
     * will be applied to a UA string to test it whether it matches or not.
     * If a descriptor has two or more regexps in the `test` array it tests them one by one
     * with a logical sum operation. Parser stops if it has found any RegExp that matches the UA.
     *
     * Or `test` could be a method. In that case it gets a Parser instance and should
     * return true/false to get the Parser know if this browser descriptor matches the UA or not.
     */


    const commonVersionIdentifier = /version\/(\d+(\.?_?\d+)+)/i;

    const browsersList = [
      /* Googlebot */
      {
        test: [/googlebot/i],
        describe(ua) {
          const browser = {
            name: 'Googlebot',
          };
          const version = Utils.getFirstMatch(/googlebot\/(\d+(\.\d+))/i, ua) || Utils.getFirstMatch(commonVersionIdentifier, ua);

          if (version) {
            browser.version = version;
          }

          return browser;
        },
      },

      /* Opera < 13.0 */
      {
        test: [/opera/i],
        describe(ua) {
          const browser = {
            name: 'Opera',
          };
          const version = Utils.getFirstMatch(commonVersionIdentifier, ua) || Utils.getFirstMatch(/(?:opera)[\s/](\d+(\.?_?\d+)+)/i, ua);

          if (version) {
            browser.version = version;
          }

          return browser;
        },
      },

      /* Opera > 13.0 */
      {
        test: [/opr\/|opios/i],
        describe(ua) {
          const browser = {
            name: 'Opera',
          };
          const version = Utils.getFirstMatch(/(?:opr|opios)[\s/](\S+)/i, ua) || Utils.getFirstMatch(commonVersionIdentifier, ua);

          if (version) {
            browser.version = version;
          }

          return browser;
        },
      },
      {
        test: [/SamsungBrowser/i],
        describe(ua) {
          const browser = {
            name: 'Samsung Internet for Android',
          };
          const version = Utils.getFirstMatch(commonVersionIdentifier, ua) || Utils.getFirstMatch(/(?:SamsungBrowser)[\s/](\d+(\.?_?\d+)+)/i, ua);

          if (version) {
            browser.version = version;
          }

          return browser;
        },
      },
      {
        test: [/Whale/i],
        describe(ua) {
          const browser = {
            name: 'NAVER Whale Browser',
          };
          const version = Utils.getFirstMatch(commonVersionIdentifier, ua) || Utils.getFirstMatch(/(?:whale)[\s/](\d+(?:\.\d+)+)/i, ua);

          if (version) {
            browser.version = version;
          }

          return browser;
        },
      },
      {
        test: [/MZBrowser/i],
        describe(ua) {
          const browser = {
            name: 'MZ Browser',
          };
          const version = Utils.getFirstMatch(/(?:MZBrowser)[\s/](\d+(?:\.\d+)+)/i, ua) || Utils.getFirstMatch(commonVersionIdentifier, ua);

          if (version) {
            browser.version = version;
          }

          return browser;
        },
      },
      {
        test: [/focus/i],
        describe(ua) {
          const browser = {
            name: 'Focus',
          };
          const version = Utils.getFirstMatch(/(?:focus)[\s/](\d+(?:\.\d+)+)/i, ua) || Utils.getFirstMatch(commonVersionIdentifier, ua);

          if (version) {
            browser.version = version;
          }

          return browser;
        },
      },
      {
        test: [/swing/i],
        describe(ua) {
          const browser = {
            name: 'Swing',
          };
          const version = Utils.getFirstMatch(/(?:swing)[\s/](\d+(?:\.\d+)+)/i, ua) || Utils.getFirstMatch(commonVersionIdentifier, ua);

          if (version) {
            browser.version = version;
          }

          return browser;
        },
      },
      {
        test: [/coast/i],
        describe(ua) {
          const browser = {
            name: 'Opera Coast',
          };
          const version = Utils.getFirstMatch(commonVersionIdentifier, ua) || Utils.getFirstMatch(/(?:coast)[\s/](\d+(\.?_?\d+)+)/i, ua);

          if (version) {
            browser.version = version;
          }

          return browser;
        },
      },
      {
        test: [/opt\/\d+(?:.?_?\d+)+/i],
        describe(ua) {
          const browser = {
            name: 'Opera Touch',
          };
          const version = Utils.getFirstMatch(/(?:opt)[\s/](\d+(\.?_?\d+)+)/i, ua) || Utils.getFirstMatch(commonVersionIdentifier, ua);

          if (version) {
            browser.version = version;
          }

          return browser;
        },
      },
      {
        test: [/yabrowser/i],
        describe(ua) {
          const browser = {
            name: 'Yandex Browser',
          };
          const version = Utils.getFirstMatch(/(?:yabrowser)[\s/](\d+(\.?_?\d+)+)/i, ua) || Utils.getFirstMatch(commonVersionIdentifier, ua);

          if (version) {
            browser.version = version;
          }

          return browser;
        },
      },
      {
        test: [/ucbrowser/i],
        describe(ua) {
          const browser = {
            name: 'UC Browser',
          };
          const version = Utils.getFirstMatch(commonVersionIdentifier, ua) || Utils.getFirstMatch(/(?:ucbrowser)[\s/](\d+(\.?_?\d+)+)/i, ua);

          if (version) {
            browser.version = version;
          }

          return browser;
        },
      },
      {
        test: [/Maxthon|mxios/i],
        describe(ua) {
          const browser = {
            name: 'Maxthon',
          };
          const version = Utils.getFirstMatch(commonVersionIdentifier, ua) || Utils.getFirstMatch(/(?:Maxthon|mxios)[\s/](\d+(\.?_?\d+)+)/i, ua);

          if (version) {
            browser.version = version;
          }

          return browser;
        },
      },
      {
        test: [/epiphany/i],
        describe(ua) {
          const browser = {
            name: 'Epiphany',
          };
          const version = Utils.getFirstMatch(commonVersionIdentifier, ua) || Utils.getFirstMatch(/(?:epiphany)[\s/](\d+(\.?_?\d+)+)/i, ua);

          if (version) {
            browser.version = version;
          }

          return browser;
        },
      },
      {
        test: [/puffin/i],
        describe(ua) {
          const browser = {
            name: 'Puffin',
          };
          const version = Utils.getFirstMatch(commonVersionIdentifier, ua) || Utils.getFirstMatch(/(?:puffin)[\s/](\d+(\.?_?\d+)+)/i, ua);

          if (version) {
            browser.version = version;
          }

          return browser;
        },
      },
      {
        test: [/sleipnir/i],
        describe(ua) {
          const browser = {
            name: 'Sleipnir',
          };
          const version = Utils.getFirstMatch(commonVersionIdentifier, ua) || Utils.getFirstMatch(/(?:sleipnir)[\s/](\d+(\.?_?\d+)+)/i, ua);

          if (version) {
            browser.version = version;
          }

          return browser;
        },
      },
      {
        test: [/k-meleon/i],
        describe(ua) {
          const browser = {
            name: 'K-Meleon',
          };
          const version = Utils.getFirstMatch(commonVersionIdentifier, ua) || Utils.getFirstMatch(/(?:k-meleon)[\s/](\d+(\.?_?\d+)+)/i, ua);

          if (version) {
            browser.version = version;
          }

          return browser;
        },
      },
      {
        test: [/micromessenger/i],
        describe(ua) {
          const browser = {
            name: 'WeChat',
          };
          const version = Utils.getFirstMatch(/(?:micromessenger)[\s/](\d+(\.?_?\d+)+)/i, ua) || Utils.getFirstMatch(commonVersionIdentifier, ua);

          if (version) {
            browser.version = version;
          }

          return browser;
        },
      },
      {
        test: [/qqbrowser/i],
        describe(ua) {
          const browser = {
            name: (/qqbrowserlite/i).test(ua) ? 'QQ Browser Lite' : 'QQ Browser',
          };
          const version = Utils.getFirstMatch(/(?:qqbrowserlite|qqbrowser)[/](\d+(\.?_?\d+)+)/i, ua) || Utils.getFirstMatch(commonVersionIdentifier, ua);

          if (version) {
            browser.version = version;
          }

          return browser;
        },
      },
      {
        test: [/msie|trident/i],
        describe(ua) {
          const browser = {
            name: 'Internet Explorer',
          };
          const version = Utils.getFirstMatch(/(?:msie |rv:)(\d+(\.?_?\d+)+)/i, ua);

          if (version) {
            browser.version = version;
          }

          return browser;
        },
      },
      {
        test: [/\sedg\//i],
        describe(ua) {
          const browser = {
            name: 'Microsoft Edge',
          };

          const version = Utils.getFirstMatch(/\sedg\/(\d+(\.?_?\d+)+)/i, ua);

          if (version) {
            browser.version = version;
          }

          return browser;
        },
      },
      {
        test: [/edg([ea]|ios)/i],
        describe(ua) {
          const browser = {
            name: 'Microsoft Edge',
          };

          const version = Utils.getSecondMatch(/edg([ea]|ios)\/(\d+(\.?_?\d+)+)/i, ua);

          if (version) {
            browser.version = version;
          }

          return browser;
        },
      },
      {
        test: [/vivaldi/i],
        describe(ua) {
          const browser = {
            name: 'Vivaldi',
          };
          const version = Utils.getFirstMatch(/vivaldi\/(\d+(\.?_?\d+)+)/i, ua);

          if (version) {
            browser.version = version;
          }

          return browser;
        },
      },
      {
        test: [/seamonkey/i],
        describe(ua) {
          const browser = {
            name: 'SeaMonkey',
          };
          const version = Utils.getFirstMatch(/seamonkey\/(\d+(\.?_?\d+)+)/i, ua);

          if (version) {
            browser.version = version;
          }

          return browser;
        },
      },
      {
        test: [/sailfish/i],
        describe(ua) {
          const browser = {
            name: 'Sailfish',
          };

          const version = Utils.getFirstMatch(/sailfish\s?browser\/(\d+(\.\d+)?)/i, ua);

          if (version) {
            browser.version = version;
          }

          return browser;
        },
      },
      {
        test: [/silk/i],
        describe(ua) {
          const browser = {
            name: 'Amazon Silk',
          };
          const version = Utils.getFirstMatch(/silk\/(\d+(\.?_?\d+)+)/i, ua);

          if (version) {
            browser.version = version;
          }

          return browser;
        },
      },
      {
        test: [/phantom/i],
        describe(ua) {
          const browser = {
            name: 'PhantomJS',
          };
          const version = Utils.getFirstMatch(/phantomjs\/(\d+(\.?_?\d+)+)/i, ua);

          if (version) {
            browser.version = version;
          }

          return browser;
        },
      },
      {
        test: [/slimerjs/i],
        describe(ua) {
          const browser = {
            name: 'SlimerJS',
          };
          const version = Utils.getFirstMatch(/slimerjs\/(\d+(\.?_?\d+)+)/i, ua);

          if (version) {
            browser.version = version;
          }

          return browser;
        },
      },
      {
        test: [/blackberry|\bbb\d+/i, /rim\stablet/i],
        describe(ua) {
          const browser = {
            name: 'BlackBerry',
          };
          const version = Utils.getFirstMatch(commonVersionIdentifier, ua) || Utils.getFirstMatch(/blackberry[\d]+\/(\d+(\.?_?\d+)+)/i, ua);

          if (version) {
            browser.version = version;
          }

          return browser;
        },
      },
      {
        test: [/(web|hpw)[o0]s/i],
        describe(ua) {
          const browser = {
            name: 'WebOS Browser',
          };
          const version = Utils.getFirstMatch(commonVersionIdentifier, ua) || Utils.getFirstMatch(/w(?:eb)?[o0]sbrowser\/(\d+(\.?_?\d+)+)/i, ua);

          if (version) {
            browser.version = version;
          }

          return browser;
        },
      },
      {
        test: [/bada/i],
        describe(ua) {
          const browser = {
            name: 'Bada',
          };
          const version = Utils.getFirstMatch(/dolfin\/(\d+(\.?_?\d+)+)/i, ua);

          if (version) {
            browser.version = version;
          }

          return browser;
        },
      },
      {
        test: [/tizen/i],
        describe(ua) {
          const browser = {
            name: 'Tizen',
          };
          const version = Utils.getFirstMatch(/(?:tizen\s?)?browser\/(\d+(\.?_?\d+)+)/i, ua) || Utils.getFirstMatch(commonVersionIdentifier, ua);

          if (version) {
            browser.version = version;
          }

          return browser;
        },
      },
      {
        test: [/qupzilla/i],
        describe(ua) {
          const browser = {
            name: 'QupZilla',
          };
          const version = Utils.getFirstMatch(/(?:qupzilla)[\s/](\d+(\.?_?\d+)+)/i, ua) || Utils.getFirstMatch(commonVersionIdentifier, ua);

          if (version) {
            browser.version = version;
          }

          return browser;
        },
      },
      {
        test: [/firefox|iceweasel|fxios/i],
        describe(ua) {
          const browser = {
            name: 'Firefox',
          };
          const version = Utils.getFirstMatch(/(?:firefox|iceweasel|fxios)[\s/](\d+(\.?_?\d+)+)/i, ua);

          if (version) {
            browser.version = version;
          }

          return browser;
        },
      },
      {
        test: [/electron/i],
        describe(ua) {
          const browser = {
            name: 'Electron',
          };
          const version = Utils.getFirstMatch(/(?:electron)\/(\d+(\.?_?\d+)+)/i, ua);

          if (version) {
            browser.version = version;
          }

          return browser;
        },
      },
      {
        test: [/MiuiBrowser/i],
        describe(ua) {
          const browser = {
            name: 'Miui',
          };
          const version = Utils.getFirstMatch(/(?:MiuiBrowser)[\s/](\d+(\.?_?\d+)+)/i, ua);

          if (version) {
            browser.version = version;
          }

          return browser;
        },
      },
      {
        test: [/chromium/i],
        describe(ua) {
          const browser = {
            name: 'Chromium',
          };
          const version = Utils.getFirstMatch(/(?:chromium)[\s/](\d+(\.?_?\d+)+)/i, ua) || Utils.getFirstMatch(commonVersionIdentifier, ua);

          if (version) {
            browser.version = version;
          }

          return browser;
        },
      },
      {
        test: [/chrome|crios|crmo/i],
        describe(ua) {
          const browser = {
            name: 'Chrome',
          };
          const version = Utils.getFirstMatch(/(?:chrome|crios|crmo)\/(\d+(\.?_?\d+)+)/i, ua);

          if (version) {
            browser.version = version;
          }

          return browser;
        },
      },
      {
        test: [/GSA/i],
        describe(ua) {
          const browser = {
            name: 'Google Search',
          };
          const version = Utils.getFirstMatch(/(?:GSA)\/(\d+(\.?_?\d+)+)/i, ua);

          if (version) {
            browser.version = version;
          }

          return browser;
        },
      },

      /* Android Browser */
      {
        test(parser) {
          const notLikeAndroid = !parser.test(/like android/i);
          const butAndroid = parser.test(/android/i);
          return notLikeAndroid && butAndroid;
        },
        describe(ua) {
          const browser = {
            name: 'Android Browser',
          };
          const version = Utils.getFirstMatch(commonVersionIdentifier, ua);

          if (version) {
            browser.version = version;
          }

          return browser;
        },
      },

      /* PlayStation 4 */
      {
        test: [/playstation 4/i],
        describe(ua) {
          const browser = {
            name: 'PlayStation 4',
          };
          const version = Utils.getFirstMatch(commonVersionIdentifier, ua);

          if (version) {
            browser.version = version;
          }

          return browser;
        },
      },

      /* Safari */
      {
        test: [/safari|applewebkit/i],
        describe(ua) {
          const browser = {
            name: 'Safari',
          };
          const version = Utils.getFirstMatch(commonVersionIdentifier, ua);

          if (version) {
            browser.version = version;
          }

          return browser;
        },
      },

      /* Something else */
      {
        test: [/.*/i],
        describe(ua) {
          /* Here we try to make sure that there are explicit details about the device
           * in order to decide what regexp exactly we want to apply
           * (as there is a specific decision based on that conclusion)
           */
          const regexpWithoutDeviceSpec = /^(.*)\/(.*) /;
          const regexpWithDeviceSpec = /^(.*)\/(.*)[ \t]\((.*)/;
          const hasDeviceSpec = ua.search('\\(') !== -1;
          const regexp = hasDeviceSpec ? regexpWithDeviceSpec : regexpWithoutDeviceSpec;
          return {
            name: Utils.getFirstMatch(regexp, ua),
            version: Utils.getSecondMatch(regexp, ua),
          };
        },
      },
    ];

    var osParsersList = [
      /* Roku */
      {
        test: [/Roku\/DVP/],
        describe(ua) {
          const version = Utils.getFirstMatch(/Roku\/DVP-(\d+\.\d+)/i, ua);
          return {
            name: OS_MAP.Roku,
            version,
          };
        },
      },

      /* Windows Phone */
      {
        test: [/windows phone/i],
        describe(ua) {
          const version = Utils.getFirstMatch(/windows phone (?:os)?\s?(\d+(\.\d+)*)/i, ua);
          return {
            name: OS_MAP.WindowsPhone,
            version,
          };
        },
      },

      /* Windows */
      {
        test: [/windows /i],
        describe(ua) {
          const version = Utils.getFirstMatch(/Windows ((NT|XP)( \d\d?.\d)?)/i, ua);
          const versionName = Utils.getWindowsVersionName(version);

          return {
            name: OS_MAP.Windows,
            version,
            versionName,
          };
        },
      },

      /* Firefox on iPad */
      {
        test: [/Macintosh(.*?) FxiOS(.*?)\//],
        describe(ua) {
          const result = {
            name: OS_MAP.iOS,
          };
          const version = Utils.getSecondMatch(/(Version\/)(\d[\d.]+)/, ua);
          if (version) {
            result.version = version;
          }
          return result;
        },
      },

      /* macOS */
      {
        test: [/macintosh/i],
        describe(ua) {
          const version = Utils.getFirstMatch(/mac os x (\d+(\.?_?\d+)+)/i, ua).replace(/[_\s]/g, '.');
          const versionName = Utils.getMacOSVersionName(version);

          const os = {
            name: OS_MAP.MacOS,
            version,
          };
          if (versionName) {
            os.versionName = versionName;
          }
          return os;
        },
      },

      /* iOS */
      {
        test: [/(ipod|iphone|ipad)/i],
        describe(ua) {
          const version = Utils.getFirstMatch(/os (\d+([_\s]\d+)*) like mac os x/i, ua).replace(/[_\s]/g, '.');

          return {
            name: OS_MAP.iOS,
            version,
          };
        },
      },

      /* Android */
      {
        test(parser) {
          const notLikeAndroid = !parser.test(/like android/i);
          const butAndroid = parser.test(/android/i);
          return notLikeAndroid && butAndroid;
        },
        describe(ua) {
          const version = Utils.getFirstMatch(/android[\s/-](\d+(\.\d+)*)/i, ua);
          const versionName = Utils.getAndroidVersionName(version);
          const os = {
            name: OS_MAP.Android,
            version,
          };
          if (versionName) {
            os.versionName = versionName;
          }
          return os;
        },
      },

      /* WebOS */
      {
        test: [/(web|hpw)[o0]s/i],
        describe(ua) {
          const version = Utils.getFirstMatch(/(?:web|hpw)[o0]s\/(\d+(\.\d+)*)/i, ua);
          const os = {
            name: OS_MAP.WebOS,
          };

          if (version && version.length) {
            os.version = version;
          }
          return os;
        },
      },

      /* BlackBerry */
      {
        test: [/blackberry|\bbb\d+/i, /rim\stablet/i],
        describe(ua) {
          const version = Utils.getFirstMatch(/rim\stablet\sos\s(\d+(\.\d+)*)/i, ua)
            || Utils.getFirstMatch(/blackberry\d+\/(\d+([_\s]\d+)*)/i, ua)
            || Utils.getFirstMatch(/\bbb(\d+)/i, ua);

          return {
            name: OS_MAP.BlackBerry,
            version,
          };
        },
      },

      /* Bada */
      {
        test: [/bada/i],
        describe(ua) {
          const version = Utils.getFirstMatch(/bada\/(\d+(\.\d+)*)/i, ua);

          return {
            name: OS_MAP.Bada,
            version,
          };
        },
      },

      /* Tizen */
      {
        test: [/tizen/i],
        describe(ua) {
          const version = Utils.getFirstMatch(/tizen[/\s](\d+(\.\d+)*)/i, ua);

          return {
            name: OS_MAP.Tizen,
            version,
          };
        },
      },

      /* Linux */
      {
        test: [/linux/i],
        describe() {
          return {
            name: OS_MAP.Linux,
          };
        },
      },

      /* Chrome OS */
      {
        test: [/CrOS/],
        describe() {
          return {
            name: OS_MAP.ChromeOS,
          };
        },
      },

      /* Playstation 4 */
      {
        test: [/PlayStation 4/],
        describe(ua) {
          const version = Utils.getFirstMatch(/PlayStation 4[/\s](\d+(\.\d+)*)/i, ua);
          return {
            name: OS_MAP.PlayStation4,
            version,
          };
        },
      },
    ];

    /*
     * Tablets go first since usually they have more specific
     * signs to detect.
     */

    var platformParsersList = [
      /* Googlebot */
      {
        test: [/googlebot/i],
        describe() {
          return {
            type: 'bot',
            vendor: 'Google',
          };
        },
      },

      /* Huawei */
      {
        test: [/huawei/i],
        describe(ua) {
          const model = Utils.getFirstMatch(/(can-l01)/i, ua) && 'Nova';
          const platform = {
            type: PLATFORMS_MAP.mobile,
            vendor: 'Huawei',
          };
          if (model) {
            platform.model = model;
          }
          return platform;
        },
      },

      /* Nexus Tablet */
      {
        test: [/nexus\s*(?:7|8|9|10).*/i],
        describe() {
          return {
            type: PLATFORMS_MAP.tablet,
            vendor: 'Nexus',
          };
        },
      },

      /* iPad */
      {
        test: [/ipad/i],
        describe() {
          return {
            type: PLATFORMS_MAP.tablet,
            vendor: 'Apple',
            model: 'iPad',
          };
        },
      },

      /* Firefox on iPad */
      {
        test: [/Macintosh(.*?) FxiOS(.*?)\//],
        describe() {
          return {
            type: PLATFORMS_MAP.tablet,
            vendor: 'Apple',
            model: 'iPad',
          };
        },
      },

      /* Amazon Kindle Fire */
      {
        test: [/kftt build/i],
        describe() {
          return {
            type: PLATFORMS_MAP.tablet,
            vendor: 'Amazon',
            model: 'Kindle Fire HD 7',
          };
        },
      },

      /* Another Amazon Tablet with Silk */
      {
        test: [/silk/i],
        describe() {
          return {
            type: PLATFORMS_MAP.tablet,
            vendor: 'Amazon',
          };
        },
      },

      /* Tablet */
      {
        test: [/tablet(?! pc)/i],
        describe() {
          return {
            type: PLATFORMS_MAP.tablet,
          };
        },
      },

      /* iPod/iPhone */
      {
        test(parser) {
          const iDevice = parser.test(/ipod|iphone/i);
          const likeIDevice = parser.test(/like (ipod|iphone)/i);
          return iDevice && !likeIDevice;
        },
        describe(ua) {
          const model = Utils.getFirstMatch(/(ipod|iphone)/i, ua);
          return {
            type: PLATFORMS_MAP.mobile,
            vendor: 'Apple',
            model,
          };
        },
      },

      /* Nexus Mobile */
      {
        test: [/nexus\s*[0-6].*/i, /galaxy nexus/i],
        describe() {
          return {
            type: PLATFORMS_MAP.mobile,
            vendor: 'Nexus',
          };
        },
      },

      /* Mobile */
      {
        test: [/[^-]mobi/i],
        describe() {
          return {
            type: PLATFORMS_MAP.mobile,
          };
        },
      },

      /* BlackBerry */
      {
        test(parser) {
          return parser.getBrowserName(true) === 'blackberry';
        },
        describe() {
          return {
            type: PLATFORMS_MAP.mobile,
            vendor: 'BlackBerry',
          };
        },
      },

      /* Bada */
      {
        test(parser) {
          return parser.getBrowserName(true) === 'bada';
        },
        describe() {
          return {
            type: PLATFORMS_MAP.mobile,
          };
        },
      },

      /* Windows Phone */
      {
        test(parser) {
          return parser.getBrowserName() === 'windows phone';
        },
        describe() {
          return {
            type: PLATFORMS_MAP.mobile,
            vendor: 'Microsoft',
          };
        },
      },

      /* Android Tablet */
      {
        test(parser) {
          const osMajorVersion = Number(String(parser.getOSVersion()).split('.')[0]);
          return parser.getOSName(true) === 'android' && (osMajorVersion >= 3);
        },
        describe() {
          return {
            type: PLATFORMS_MAP.tablet,
          };
        },
      },

      /* Android Mobile */
      {
        test(parser) {
          return parser.getOSName(true) === 'android';
        },
        describe() {
          return {
            type: PLATFORMS_MAP.mobile,
          };
        },
      },

      /* desktop */
      {
        test(parser) {
          return parser.getOSName(true) === 'macos';
        },
        describe() {
          return {
            type: PLATFORMS_MAP.desktop,
            vendor: 'Apple',
          };
        },
      },

      /* Windows */
      {
        test(parser) {
          return parser.getOSName(true) === 'windows';
        },
        describe() {
          return {
            type: PLATFORMS_MAP.desktop,
          };
        },
      },

      /* Linux */
      {
        test(parser) {
          return parser.getOSName(true) === 'linux';
        },
        describe() {
          return {
            type: PLATFORMS_MAP.desktop,
          };
        },
      },

      /* PlayStation 4 */
      {
        test(parser) {
          return parser.getOSName(true) === 'playstation 4';
        },
        describe() {
          return {
            type: PLATFORMS_MAP.tv,
          };
        },
      },

      /* Roku */
      {
        test(parser) {
          return parser.getOSName(true) === 'roku';
        },
        describe() {
          return {
            type: PLATFORMS_MAP.tv,
          };
        },
      },
    ];

    /*
     * More specific goes first
     */
    var enginesParsersList = [
      /* EdgeHTML */
      {
        test(parser) {
          return parser.getBrowserName(true) === 'microsoft edge';
        },
        describe(ua) {
          const isBlinkBased = /\sedg\//i.test(ua);

          // return blink if it's blink-based one
          if (isBlinkBased) {
            return {
              name: ENGINE_MAP.Blink,
            };
          }

          // otherwise match the version and return EdgeHTML
          const version = Utils.getFirstMatch(/edge\/(\d+(\.?_?\d+)+)/i, ua);

          return {
            name: ENGINE_MAP.EdgeHTML,
            version,
          };
        },
      },

      /* Trident */
      {
        test: [/trident/i],
        describe(ua) {
          const engine = {
            name: ENGINE_MAP.Trident,
          };

          const version = Utils.getFirstMatch(/trident\/(\d+(\.?_?\d+)+)/i, ua);

          if (version) {
            engine.version = version;
          }

          return engine;
        },
      },

      /* Presto */
      {
        test(parser) {
          return parser.test(/presto/i);
        },
        describe(ua) {
          const engine = {
            name: ENGINE_MAP.Presto,
          };

          const version = Utils.getFirstMatch(/presto\/(\d+(\.?_?\d+)+)/i, ua);

          if (version) {
            engine.version = version;
          }

          return engine;
        },
      },

      /* Gecko */
      {
        test(parser) {
          const isGecko = parser.test(/gecko/i);
          const likeGecko = parser.test(/like gecko/i);
          return isGecko && !likeGecko;
        },
        describe(ua) {
          const engine = {
            name: ENGINE_MAP.Gecko,
          };

          const version = Utils.getFirstMatch(/gecko\/(\d+(\.?_?\d+)+)/i, ua);

          if (version) {
            engine.version = version;
          }

          return engine;
        },
      },

      /* Blink */
      {
        test: [/(apple)?webkit\/537\.36/i],
        describe() {
          return {
            name: ENGINE_MAP.Blink,
          };
        },
      },

      /* WebKit */
      {
        test: [/(apple)?webkit/i],
        describe(ua) {
          const engine = {
            name: ENGINE_MAP.WebKit,
          };

          const version = Utils.getFirstMatch(/webkit\/(\d+(\.?_?\d+)+)/i, ua);

          if (version) {
            engine.version = version;
          }

          return engine;
        },
      },
    ];

    /**
     * The main class that arranges the whole parsing process.
     */
    class Parser {
      /**
       * Create instance of Parser
       *
       * @param {String} UA User-Agent string
       * @param {Boolean} [skipParsing=false] parser can skip parsing in purpose of performance
       * improvements if you need to make a more particular parsing
       * like {@link Parser#parseBrowser} or {@link Parser#parsePlatform}
       *
       * @throw {Error} in case of empty UA String
       *
       * @constructor
       */
      constructor(UA, skipParsing = false) {
        if (UA === void (0) || UA === null || UA === '') {
          throw new Error("UserAgent parameter can't be empty");
        }

        this._ua = UA;

        /**
         * @typedef ParsedResult
         * @property {Object} browser
         * @property {String|undefined} [browser.name]
         * Browser name, like `"Chrome"` or `"Internet Explorer"`
         * @property {String|undefined} [browser.version] Browser version as a String `"12.01.45334.10"`
         * @property {Object} os
         * @property {String|undefined} [os.name] OS name, like `"Windows"` or `"macOS"`
         * @property {String|undefined} [os.version] OS version, like `"NT 5.1"` or `"10.11.1"`
         * @property {String|undefined} [os.versionName] OS name, like `"XP"` or `"High Sierra"`
         * @property {Object} platform
         * @property {String|undefined} [platform.type]
         * platform type, can be either `"desktop"`, `"tablet"` or `"mobile"`
         * @property {String|undefined} [platform.vendor] Vendor of the device,
         * like `"Apple"` or `"Samsung"`
         * @property {String|undefined} [platform.model] Device model,
         * like `"iPhone"` or `"Kindle Fire HD 7"`
         * @property {Object} engine
         * @property {String|undefined} [engine.name]
         * Can be any of this: `WebKit`, `Blink`, `Gecko`, `Trident`, `Presto`, `EdgeHTML`
         * @property {String|undefined} [engine.version] String version of the engine
         */
        this.parsedResult = {};

        if (skipParsing !== true) {
          this.parse();
        }
      }

      /**
       * Get UserAgent string of current Parser instance
       * @return {String} User-Agent String of the current <Parser> object
       *
       * @public
       */
      getUA() {
        return this._ua;
      }

      /**
       * Test a UA string for a regexp
       * @param {RegExp} regex
       * @return {Boolean}
       */
      test(regex) {
        return regex.test(this._ua);
      }

      /**
       * Get parsed browser object
       * @return {Object}
       */
      parseBrowser() {
        this.parsedResult.browser = {};

        const browserDescriptor = Utils.find(browsersList, (_browser) => {
          if (typeof _browser.test === 'function') {
            return _browser.test(this);
          }

          if (_browser.test instanceof Array) {
            return _browser.test.some(condition => this.test(condition));
          }

          throw new Error("Browser's test function is not valid");
        });

        if (browserDescriptor) {
          this.parsedResult.browser = browserDescriptor.describe(this.getUA());
        }

        return this.parsedResult.browser;
      }

      /**
       * Get parsed browser object
       * @return {Object}
       *
       * @public
       */
      getBrowser() {
        if (this.parsedResult.browser) {
          return this.parsedResult.browser;
        }

        return this.parseBrowser();
      }

      /**
       * Get browser's name
       * @return {String} Browser's name or an empty string
       *
       * @public
       */
      getBrowserName(toLowerCase) {
        if (toLowerCase) {
          return String(this.getBrowser().name).toLowerCase() || '';
        }
        return this.getBrowser().name || '';
      }


      /**
       * Get browser's version
       * @return {String} version of browser
       *
       * @public
       */
      getBrowserVersion() {
        return this.getBrowser().version;
      }

      /**
       * Get OS
       * @return {Object}
       *
       * @example
       * this.getOS();
       * {
       *   name: 'macOS',
       *   version: '10.11.12'
       * }
       */
      getOS() {
        if (this.parsedResult.os) {
          return this.parsedResult.os;
        }

        return this.parseOS();
      }

      /**
       * Parse OS and save it to this.parsedResult.os
       * @return {*|{}}
       */
      parseOS() {
        this.parsedResult.os = {};

        const os = Utils.find(osParsersList, (_os) => {
          if (typeof _os.test === 'function') {
            return _os.test(this);
          }

          if (_os.test instanceof Array) {
            return _os.test.some(condition => this.test(condition));
          }

          throw new Error("Browser's test function is not valid");
        });

        if (os) {
          this.parsedResult.os = os.describe(this.getUA());
        }

        return this.parsedResult.os;
      }

      /**
       * Get OS name
       * @param {Boolean} [toLowerCase] return lower-cased value
       * @return {String} name of the OS — macOS, Windows, Linux, etc.
       */
      getOSName(toLowerCase) {
        const { name } = this.getOS();

        if (toLowerCase) {
          return String(name).toLowerCase() || '';
        }

        return name || '';
      }

      /**
       * Get OS version
       * @return {String} full version with dots ('10.11.12', '5.6', etc)
       */
      getOSVersion() {
        return this.getOS().version;
      }

      /**
       * Get parsed platform
       * @return {{}}
       */
      getPlatform() {
        if (this.parsedResult.platform) {
          return this.parsedResult.platform;
        }

        return this.parsePlatform();
      }

      /**
       * Get platform name
       * @param {Boolean} [toLowerCase=false]
       * @return {*}
       */
      getPlatformType(toLowerCase = false) {
        const { type } = this.getPlatform();

        if (toLowerCase) {
          return String(type).toLowerCase() || '';
        }

        return type || '';
      }

      /**
       * Get parsed platform
       * @return {{}}
       */
      parsePlatform() {
        this.parsedResult.platform = {};

        const platform = Utils.find(platformParsersList, (_platform) => {
          if (typeof _platform.test === 'function') {
            return _platform.test(this);
          }

          if (_platform.test instanceof Array) {
            return _platform.test.some(condition => this.test(condition));
          }

          throw new Error("Browser's test function is not valid");
        });

        if (platform) {
          this.parsedResult.platform = platform.describe(this.getUA());
        }

        return this.parsedResult.platform;
      }

      /**
       * Get parsed engine
       * @return {{}}
       */
      getEngine() {
        if (this.parsedResult.engine) {
          return this.parsedResult.engine;
        }

        return this.parseEngine();
      }

      /**
       * Get engines's name
       * @return {String} Engines's name or an empty string
       *
       * @public
       */
      getEngineName(toLowerCase) {
        if (toLowerCase) {
          return String(this.getEngine().name).toLowerCase() || '';
        }
        return this.getEngine().name || '';
      }

      /**
       * Get parsed platform
       * @return {{}}
       */
      parseEngine() {
        this.parsedResult.engine = {};

        const engine = Utils.find(enginesParsersList, (_engine) => {
          if (typeof _engine.test === 'function') {
            return _engine.test(this);
          }

          if (_engine.test instanceof Array) {
            return _engine.test.some(condition => this.test(condition));
          }

          throw new Error("Browser's test function is not valid");
        });

        if (engine) {
          this.parsedResult.engine = engine.describe(this.getUA());
        }

        return this.parsedResult.engine;
      }

      /**
       * Parse full information about the browser
       * @returns {Parser}
       */
      parse() {
        this.parseBrowser();
        this.parseOS();
        this.parsePlatform();
        this.parseEngine();

        return this;
      }

      /**
       * Get parsed result
       * @return {ParsedResult}
       */
      getResult() {
        return Utils.assign({}, this.parsedResult);
      }

      /**
       * Check if parsed browser matches certain conditions
       *
       * @param {Object} checkTree It's one or two layered object,
       * which can include a platform or an OS on the first layer
       * and should have browsers specs on the bottom-laying layer
       *
       * @returns {Boolean|undefined} Whether the browser satisfies the set conditions or not.
       * Returns `undefined` when the browser is no described in the checkTree object.
       *
       * @example
       * const browser = Bowser.getParser(window.navigator.userAgent);
       * if (browser.satisfies({chrome: '>118.01.1322' }))
       * // or with os
       * if (browser.satisfies({windows: { chrome: '>118.01.1322' } }))
       * // or with platforms
       * if (browser.satisfies({desktop: { chrome: '>118.01.1322' } }))
       */
      satisfies(checkTree) {
        const platformsAndOSes = {};
        let platformsAndOSCounter = 0;
        const browsers = {};
        let browsersCounter = 0;

        const allDefinitions = Object.keys(checkTree);

        allDefinitions.forEach((key) => {
          const currentDefinition = checkTree[key];
          if (typeof currentDefinition === 'string') {
            browsers[key] = currentDefinition;
            browsersCounter += 1;
          } else if (typeof currentDefinition === 'object') {
            platformsAndOSes[key] = currentDefinition;
            platformsAndOSCounter += 1;
          }
        });

        if (platformsAndOSCounter > 0) {
          const platformsAndOSNames = Object.keys(platformsAndOSes);
          const OSMatchingDefinition = Utils.find(platformsAndOSNames, name => (this.isOS(name)));

          if (OSMatchingDefinition) {
            const osResult = this.satisfies(platformsAndOSes[OSMatchingDefinition]);

            if (osResult !== void 0) {
              return osResult;
            }
          }

          const platformMatchingDefinition = Utils.find(
            platformsAndOSNames,
            name => (this.isPlatform(name)),
          );
          if (platformMatchingDefinition) {
            const platformResult = this.satisfies(platformsAndOSes[platformMatchingDefinition]);

            if (platformResult !== void 0) {
              return platformResult;
            }
          }
        }

        if (browsersCounter > 0) {
          const browserNames = Object.keys(browsers);
          const matchingDefinition = Utils.find(browserNames, name => (this.isBrowser(name, true)));

          if (matchingDefinition !== void 0) {
            return this.compareVersion(browsers[matchingDefinition]);
          }
        }

        return undefined;
      }

      /**
       * Check if the browser name equals the passed string
       * @param browserName The string to compare with the browser name
       * @param [includingAlias=false] The flag showing whether alias will be included into comparison
       * @returns {boolean}
       */
      isBrowser(browserName, includingAlias = false) {
        const defaultBrowserName = this.getBrowserName().toLowerCase();
        let browserNameLower = browserName.toLowerCase();
        const alias = Utils.getBrowserTypeByAlias(browserNameLower);

        if (includingAlias && alias) {
          browserNameLower = alias.toLowerCase();
        }
        return browserNameLower === defaultBrowserName;
      }

      compareVersion(version) {
        let expectedResults = [0];
        let comparableVersion = version;
        let isLoose = false;

        const currentBrowserVersion = this.getBrowserVersion();

        if (typeof currentBrowserVersion !== 'string') {
          return void 0;
        }

        if (version[0] === '>' || version[0] === '<') {
          comparableVersion = version.substr(1);
          if (version[1] === '=') {
            isLoose = true;
            comparableVersion = version.substr(2);
          } else {
            expectedResults = [];
          }
          if (version[0] === '>') {
            expectedResults.push(1);
          } else {
            expectedResults.push(-1);
          }
        } else if (version[0] === '=') {
          comparableVersion = version.substr(1);
        } else if (version[0] === '~') {
          isLoose = true;
          comparableVersion = version.substr(1);
        }

        return expectedResults.indexOf(
          Utils.compareVersions(currentBrowserVersion, comparableVersion, isLoose),
        ) > -1;
      }

      isOS(osName) {
        return this.getOSName(true) === String(osName).toLowerCase();
      }

      isPlatform(platformType) {
        return this.getPlatformType(true) === String(platformType).toLowerCase();
      }

      isEngine(engineName) {
        return this.getEngineName(true) === String(engineName).toLowerCase();
      }

      /**
       * Is anything? Check if the browser is called "anything",
       * the OS called "anything" or the platform called "anything"
       * @param {String} anything
       * @param [includingAlias=false] The flag showing whether alias will be included into comparison
       * @returns {Boolean}
       */
      is(anything, includingAlias = false) {
        return this.isBrowser(anything, includingAlias) || this.isOS(anything)
          || this.isPlatform(anything);
      }

      /**
       * Check if any of the given values satisfies this.is(anything)
       * @param {String[]} anythings
       * @returns {Boolean}
       */
      some(anythings = []) {
        return anythings.some(anything => this.is(anything));
      }
    }

    /*!
     * Bowser - a browser detector
     * https://github.com/lancedikson/bowser
     * MIT License | (c) Dustin Diaz 2012-2015
     * MIT License | (c) Denis Demchenko 2015-2019
     */

    /**
     * Bowser class.
     * Keep it simple as much as it can be.
     * It's supposed to work with collections of {@link Parser} instances
     * rather then solve one-instance problems.
     * All the one-instance stuff is located in Parser class.
     *
     * @class
     * @classdesc Bowser is a static object, that provides an API to the Parsers
     * @hideconstructor
     */
    class Bowser {
      /**
       * Creates a {@link Parser} instance
       *
       * @param {String} UA UserAgent string
       * @param {Boolean} [skipParsing=false] Will make the Parser postpone parsing until you ask it
       * explicitly. Same as `skipParsing` for {@link Parser}.
       * @returns {Parser}
       * @throws {Error} when UA is not a String
       *
       * @example
       * const parser = Bowser.getParser(window.navigator.userAgent);
       * const result = parser.getResult();
       */
      static getParser(UA, skipParsing = false) {
        if (typeof UA !== 'string') {
          throw new Error('UserAgent should be a string');
        }
        return new Parser(UA, skipParsing);
      }

      /**
       * Creates a {@link Parser} instance and runs {@link Parser.getResult} immediately
       *
       * @param UA
       * @return {ParsedResult}
       *
       * @example
       * const result = Bowser.parse(window.navigator.userAgent);
       */
      static parse(UA) {
        return (new Parser(UA)).getResult();
      }

      static get BROWSER_MAP() {
        return BROWSER_MAP;
      }

      static get ENGINE_MAP() {
        return ENGINE_MAP;
      }

      static get OS_MAP() {
        return OS_MAP;
      }

      static get PLATFORMS_MAP() {
        return PLATFORMS_MAP;
      }
    }

    function PageInformationTracker() {
        var _a, _b;
        const { host, hostname, href, protocol, origin, port, pathname, search, hash } = window.location;
        const { width, height } = window.screen;
        const { language, userAgent } = navigator;
        return {
            host,
            hostname,
            href,
            protocol,
            origin,
            port,
            pathname,
            search,
            hash,
            title: document.title,
            language: language.substr(0, 2),
            userAgent: resolveUserAgent(userAgent),
            winScreen: `${width}x${height}`,
            docScreen: `${(_a = document.documentElement.clientWidth) !== null && _a !== void 0 ? _a : document.body.clientWidth}x${(_b = document.documentElement.clientHeight) !== null && _b !== void 0 ? _b : document.body.clientHeight}`,
        };
    }
    function resolveUserAgent(userAgent) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        const browserData = Bowser.parse(userAgent);
        const parserData = uaParser(userAgent);
        const browserName = (_a = browserData.browser.name) !== null && _a !== void 0 ? _a : parserData.browser.name; // 浏览器名
        const browserVersion = (_b = browserData.browser.version) !== null && _b !== void 0 ? _b : parserData.browser.version; // 浏览器版本号
        const osName = (_c = browserData.os.name) !== null && _c !== void 0 ? _c : parserData.os.name; // 操作系统名
        const osVersion = (_d = parserData.os.version) !== null && _d !== void 0 ? _d : browserData.os.version; // 操作系统版本号
        const deviceType = (_e = browserData.platform.type) !== null && _e !== void 0 ? _e : parserData.device.type; // 设备类型
        const deviceVendor = (_g = (_f = browserData.platform.vendor) !== null && _f !== void 0 ? _f : parserData.device.vendor) !== null && _g !== void 0 ? _g : ''; // 设备所属公司
        const deviceModel = (_j = (_h = browserData.platform.model) !== null && _h !== void 0 ? _h : parserData.device.model) !== null && _j !== void 0 ? _j : ''; // 设备型号
        const engineName = (_k = browserData.engine.name) !== null && _k !== void 0 ? _k : parserData.engine.name; // engine名
        const engineVersion = (_l = browserData.engine.version) !== null && _l !== void 0 ? _l : parserData.engine.version; // engine版本号
        return {
            browserName,
            browserVersion,
            osName,
            osVersion,
            deviceType,
            deviceVendor,
            deviceModel,
            engineName,
            engineVersion,
        };
    }

    class BehaviorStack {
        constructor(maxStackLength) {
            this.maxStackLength = maxStackLength;
        }
        set(data) {
            if (this.behaviorStackList.length == this.maxStackLength) {
                this.behaviorStackList.shift();
            }
            this.behaviorStackList.push(data);
        }
        get() {
            return this.behaviorStackList;
        }
        clear() {
            this.behaviorStackList = [];
        }
    }

    /**
     * @param href url
     * @param origin 页面来源（返回一个包含协议，域名，端口号的字符串）
     * @param protocol 协议号 例如 https
     * @param host 域名 + 端口号 例如： www.example.com:8080
     * @param hostname 域名 例如：www.example.com
     * @param port 端口号 例如 8080
     * @param pathname 路由路径  例如：/page
     * @param search 查询字符串 例如 ?param1=value1&param2=value2
     * @param hash URL 中的片段标识符部分，即 # 及其后的部分。
     * @param title 网页标题
     * @param language 浏览器的语种 (eg:zh) ; 这里截取前两位，有需要也可以不截取
     * @param userAgentData 用户 userAgent 信息
     * @param winScreen 屏幕宽高 (eg:1920x1080)  屏幕宽高意为整个显示屏的宽高
     * @param docScreen 文档宽高 (eg:1388x937)   文档宽高意为当前页面显示的实际宽高
     *
     */
    var Data$1;
    (function (Data) {
        Data["Dom"] = "DomDataList";
        Data["RouterChange"] = "RouterChangeData";
        Data["PageInfo"] = "PageInfo";
    })(Data$1 || (Data$1 = {}));

    class userAction {
        constructor(options, reportTracker) {
            this.options = Object.assign(this.initDef(), options);
            this.data = {};
            this.reportTracker = reportTracker;
            this.behaviorStack = new BehaviorStack(this.options.maxStackLength);
            this.eventTracker();
        }
        //默认设置
        initDef() {
            return {
                PI: true,
                OI: true,
                RouterChange: true,
                Dom: true,
                HT: true,
                BS: true,
                pageInfo: true,
                elementTrackList: ['button'],
                attributeTrackList: 'target-key',
                MouseEventList: ['click'],
                maxStackLength: 100,
            };
        }
        eventTracker() {
            if (this.options.RouterChange) {
                this.RouterChange();
            }
            if (this.options.pageInfo) {
                this.pageData();
            }
            if (this.options.Dom) {
                this.Dom();
            }
        }
        /**
         * dom
         *
         */
        Dom() {
            domTracker((e, event) => {
                var _a, _b;
                const target = e.target;
                const targetKey = target.getAttribute(this.options.attributeTrackList);
                let isElementTrack = this.options.elementTrackList.includes((_b = (_a = event.target) === null || _a === void 0 ? void 0 : _a.tagName) === null || _b === void 0 ? void 0 : _b.toLocaleLowerCase())
                    ? event.target
                    : undefined;
                if (isElementTrack) {
                    const domData = {
                        tagInfo: {
                            id: target.id,
                            classList: Array.from(target.classList),
                            tagName: target.tagName,
                            text: target.textContent,
                        },
                        pageInfo: PageInformationTracker(),
                        time: new Date().getTime(),
                        timeFormat: utcFormat(new Date().getTime()),
                    };
                    if (this.data[Data$1.Dom])
                        this.data[Data$1.Dom].push(domData);
                    else
                        this.data[Data$1.Dom] = [domData];
                    // 添加到行为栈中
                    const hehaviorStackData = {
                        name: event,
                        pathname: PageInformationTracker().pathname,
                        value: {
                            tagInfo: {
                                id: target.id,
                                classList: Array.from(target.classList),
                                tagName: target.tagName,
                                text: target.textContent,
                            },
                            pageInfo: PageInformationTracker(),
                        },
                        time: new Date().getTime(),
                        timeFormat: utcFormat(new Date().getTime()),
                    };
                    this.behaviorStack.set(hehaviorStackData);
                }
                else if (targetKey) {
                    this.reportTracker({
                        kind: 'stability',
                        trackerType: 'domTracker',
                        event,
                        targetKey,
                    });
                }
            }, this.options.MouseEventList);
        }
        /**
         * router监控
         *
         */
        RouterChange() {
            RouterChangeTracker((e) => {
                const routerData = {
                    routerType: e.type,
                    pageInfo: PageInformationTracker(),
                    time: new Date().getTime(),
                    timeFormat: utcFormat(new Date().getTime()),
                };
                if (this.data[Data$1.RouterChange])
                    this.data[Data$1.RouterChange].push(routerData);
                else
                    this.data[Data$1.RouterChange] = [routerData];
                const hehaviorStackData = {
                    name: 'RouterChange',
                    pathname: PageInformationTracker().pathname,
                    value: {
                        Type: e.type,
                    },
                    time: new Date().getTime(),
                    timeFormat: utcFormat(new Date().getTime()),
                };
                this.behaviorStack.set(hehaviorStackData);
                // 当路由发生变化就重新上报页面数据
                this.pageData();
            });
        }
        /**
         * 页面信息
         *
         */
        pageData() {
            const pageData = {
                pageInformation: PageInformationTracker(),
                originInformation: OriginInformationTracker(),
            };
            this.data[Data$1.PageInfo] = pageData;
            this.reportTracker(pageData);
        }
        /**
         * ajax请求
         *
         */
        AjaxXhr() {
        }
    }

    function xhrTracker(handlerReport) {
        let XMLHttpRequest = window.XMLHttpRequest;
        // 对XHR上面的方法进行重写
        let oldOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function (method, url) {
            //排除阿里云接口和webpack脏值检测
            if (!url.match(/logstores/) && !url.match(/sockjs/)) {
                this.logData = { method, url };
            }
            return oldOpen.call(this, method, url, true);
        };
        let oldSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function (body) {
            if (this.logData) {
                let startTime = Date.now();
                let handler = (type) => (event) => {
                    let duration = Date.now() - startTime;
                    let status = this.status;
                    let statusText = this.statusText;
                    let data = {
                        trackerType: 'xhrError',
                        eventType: event.type,
                        method: this.logData.method,
                        url: this.logData.url,
                        status: status,
                        statusText: statusText,
                        duration: duration,
                        response: this.response ? JSON.stringify(this.response) : '',
                        params: body || '',
                    };
                    handlerReport(data);
                };
                this.addEventListener('error', handler(), false);
                this.addEventListener('load', handler(), false);
                this.addEventListener('abort', handler(), false);
            }
            return oldSend.call(this, body);
        };
    }

    class BlankScreenTracker {
        constructor(reportTracker) {
            this.reportTracker = reportTracker;
            this.emptyPoint = 0;
            this.load();
            // this.element()
        }
        load() {
            // 页面状态为complete才进行
            if (document.readyState === 'complete') {
                this.element();
            }
            else {
                window.addEventListener('load', () => {
                    this.element();
                    if (this.emptyPoint > 8) {
                        let centerElement = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
                        this.reportTracker({
                            kind: 'userAction',
                            trackerType: 'blank',
                            emptyPoint: this.emptyPoint,
                            screen: window.screen.width + 'X' + window.screen.height,
                            viewPoint: window.innerWidth + 'X' + window.innerHeight,
                            selector: this.getSelector(centerElement), //放中间元素
                        });
                    }
                });
            }
        }
        element() {
            for (let i = 0; i < 9; i++) {
                let XElement = document.elementFromPoint((window.innerWidth * i) / 10, window.innerHeight / 2);
                let YElement = document.elementFromPoint(window.innerWidth / 2, (window.innerHeight * i) / 10);
                this.isWrapper(XElement);
                this.isWrapper(YElement);
            }
        }
        /**
       * 判断是否白点
       */
        isWrapper(element) {
            let WrapperElement = ['html', 'body', '#container', '.content'];
            let selector = this.getSelector(element);
            if (WrapperElement.indexOf(selector) != -1) {
                this.emptyPoint++;
            }
        }
        getSelector(element) {
            if (element === null || element === void 0 ? void 0 : element.id) {
                return '#' + element.id;
            }
            else if (element === null || element === void 0 ? void 0 : element.className) {
                // 处理一个dom上面class可能多个的问题
                let className = element.className
                    .split(' ')
                    .filter((item) => !!item)
                    .join('.');
                return '.' + className;
            }
            else {
                return element === null || element === void 0 ? void 0 : element.nodeName.toLowerCase();
            }
        }
    }

    class ErrorTracker {
        constructor(options, reportTracker) {
            this.reportTracker = reportTracker;
            this.options = Object.assign(this.initDef(), options);
            this.errorEvent();
        }
        errorEvent() {
            if (this.options.js)
                this.jsError();
            if (this.options.http)
                this.httpError();
            if (this.options.promise)
                this.promiseError();
            if (this.options.resource)
                this.resourceError();
            if (this.options.BlankScreen)
                this.BlankScreen();
        }
        //默认设置
        initDef() {
            return {
                performance: true,
                cache: true,
                loading: true,
                resourceFlow: true,
            };
        }
        /**
         * error of common js
         *
         */
        jsError() {
            window.addEventListener('error', (event) => {
                if (event.colno) {
                    this.reportTracker({
                        kind: 'error',
                        trackerType: 'JsError',
                        message: event.message,
                        fileName: event.filename,
                        position: `line:${event.lineno},col:${event.colno}`,
                        stack: this.getLine(event.error.stack, 1),
                        url: location.pathname,
                    });
                }
            }, true);
        }
        /**
         *   Error of resource
         */
        resourceError() {
            window.addEventListener('error', (event) => {
                const target = event.target;
                if (target && target.src) {
                    this.reportTracker({
                        kind: 'error',
                        trackerType: 'resourceError',
                        fileName: target.src,
                        tagName: target.tagName,
                        Html: target.outerHTML,
                        url: location.pathname,
                    });
                }
            }, true);
        }
        /**
         * error of promise
         */
        promiseError() {
            window.addEventListener('unhandledrejection', (event) => {
                let message;
                let fileName;
                let position;
                let stack;
                let reason = event.reason;
                //判断resolve或者reject传递的是什么，如果只是字符串就直接返回了
                if (typeof reason === 'string') {
                    message = reason;
                }
                else if (typeof reason === 'object') {
                    if (reason.stack) {
                        message = reason.message;
                        let matchResult = reason.stack.match(/(?:at\s+)?(http:\/\/[^\s]+\/[^\s]+):(\d+:\d+)/);
                        stack = this.getLine(reason.stack, 3);
                        fileName = matchResult[1];
                        position = matchResult[2];
                    }
                }
                event.promise.catch((error) => {
                    this.reportTracker({
                        kind: 'error',
                        trackerType: 'PromiseError',
                        url: location.pathname,
                        message,
                        fileName,
                        stack,
                        position,
                    });
                });
            });
        }
        /**
         * error of Http
         */
        httpError() {
            const handler = (xhrTrackerData) => {
                // 大于400才进行上报
                if (xhrTrackerData.status < 400)
                    return;
                this.reportTracker(Object.assign({ kind: 'error' }, xhrTrackerData));
            };
            xhrTracker(handler);
        }
        /**
         * 白屏监控
         *
         */
        BlankScreen() {
            new BlankScreenTracker(this.reportTracker);
        }
        /**
         * 拼接stack
         * @param stack
         * @returns
         */
        getLine(stack, sliceNum) {
            return stack
                .split('\n')
                .slice(sliceNum)
                .map((item) => item.replace(/^\s+at\s+/g, ''))
                .join('^');
        }
    }

    function resourceFlow() {
        const resouceDatas = performance.getEntriesByType('resource');
        return resouceDatas.map((resourceData) => {
            const { name, transferSize, initiatorType, startTime, responseEnd, domainLookupEnd, domainLookupStart, connectStart, connectEnd, secureConnectionStart, responseStart, requestStart, } = resourceData;
            return {
                name,
                initiatorType,
                transferSize,
                start: startTime,
                end: responseEnd,
                DNS: domainLookupEnd - domainLookupStart,
                TCP: connectEnd - connectStart,
                SSL: connectEnd - secureConnectionStart,
                TTFB: responseStart - requestStart,
                Trans: responseEnd - requestStart,
            };
        });
    }

    function loadingData() {
        const loadingData = performance.getEntriesByType('navigation')[0];
        const { domainLookupStart, domainLookupEnd, connectStart, connectEnd, secureConnectionStart, requestStart, responseStart, responseEnd, domInteractive, domContentLoadedEventEnd, loadEventStart, fetchStart, } = loadingData;
        return {
            DNS: {
                start: domainLookupStart,
                end: domainLookupEnd,
                value: domainLookupEnd - domainLookupStart,
            },
            TCP: {
                start: connectStart,
                end: connectEnd,
                value: connectEnd - connectStart,
            },
            SSL: {
                start: secureConnectionStart !== null && secureConnectionStart !== void 0 ? secureConnectionStart : 0,
                end: secureConnectionStart ? connectEnd : 0,
                value: secureConnectionStart ? connectEnd - secureConnectionStart : 0,
            },
            TTFB: {
                start: requestStart,
                end: responseStart,
                value: responseStart - requestStart,
            },
            Trans: {
                start: responseStart,
                end: responseEnd,
                value: responseEnd - responseStart,
            },
            FP: {
                start: fetchStart,
                end: responseEnd,
                value: responseEnd - fetchStart,
            },
            DomParse: {
                start: responseEnd,
                end: domInteractive,
                value: domInteractive - responseEnd,
            },
            TTI: {
                start: fetchStart,
                end: domInteractive,
                value: domInteractive - fetchStart,
            },
            DomReady: {
                start: fetchStart,
                end: domContentLoadedEventEnd,
                value: domContentLoadedEventEnd - fetchStart,
            },
            Res: {
                start: responseEnd,
                end: loadEventStart,
                value: loadEventStart - responseEnd,
            },
            Load: {
                start: fetchStart,
                end: loadEventStart,
                value: loadEventStart - fetchStart,
            },
        };
    }

    var e,n,t,i,a=-1,o=function(e){addEventListener("pageshow",(function(n){n.persisted&&(a=n.timeStamp,e(n));}),!0);},c=function(){return window.performance&&performance.getEntriesByType&&performance.getEntriesByType("navigation")[0]},u=function(){var e=c();return e&&e.activationStart||0},f=function(e,n){var t=c(),i="navigate";a>=0?i="back-forward-cache":t&&(document.prerendering||u()>0?i="prerender":document.wasDiscarded?i="restore":t.type&&(i=t.type.replace(/_/g,"-")));return {name:e,value:void 0===n?-1:n,rating:"good",delta:0,entries:[],id:"v3-".concat(Date.now(),"-").concat(Math.floor(8999999999999*Math.random())+1e12),navigationType:i}},s=function(e,n,t){try{if(PerformanceObserver.supportedEntryTypes.includes(e)){var i=new PerformanceObserver((function(e){Promise.resolve().then((function(){n(e.getEntries());}));}));return i.observe(Object.assign({type:e,buffered:!0},t||{})),i}}catch(e){}},d=function(e,n,t,i){var r,a;return function(o){n.value>=0&&(o||i)&&((a=n.value-(r||0))||void 0===r)&&(r=n.value,n.delta=a,n.rating=function(e,n){return e>n[1]?"poor":e>n[0]?"needs-improvement":"good"}(n.value,t),e(n));}},l=function(e){requestAnimationFrame((function(){return requestAnimationFrame((function(){return e()}))}));},p=function(e){var n=function(n){"pagehide"!==n.type&&"hidden"!==document.visibilityState||e(n);};addEventListener("visibilitychange",n,!0),addEventListener("pagehide",n,!0);},v=function(e){var n=!1;return function(t){n||(e(t),n=!0);}},m=-1,h=function(){return "hidden"!==document.visibilityState||document.prerendering?1/0:0},g=function(e){"hidden"===document.visibilityState&&m>-1&&(m="visibilitychange"===e.type?e.timeStamp:0,T());},y=function(){addEventListener("visibilitychange",g,!0),addEventListener("prerenderingchange",g,!0);},T=function(){removeEventListener("visibilitychange",g,!0),removeEventListener("prerenderingchange",g,!0);},E=function(){return m<0&&(m=h(),y(),o((function(){setTimeout((function(){m=h(),y();}),0);}))),{get firstHiddenTime(){return m}}},C=function(e){document.prerendering?addEventListener("prerenderingchange",(function(){return e()}),!0):e();},L=[1800,3e3],w=function(e,n){n=n||{},C((function(){var t,i=E(),r=f("FCP"),a=s("paint",(function(e){e.forEach((function(e){"first-contentful-paint"===e.name&&(a.disconnect(),e.startTime<i.firstHiddenTime&&(r.value=Math.max(e.startTime-u(),0),r.entries.push(e),t(!0)));}));}));a&&(t=d(e,r,L,n.reportAllChanges),o((function(i){r=f("FCP"),t=d(e,r,L,n.reportAllChanges),l((function(){r.value=performance.now()-i.timeStamp,t(!0);}));})));}));},b=[.1,.25],S=function(e,n){n=n||{},w(v((function(){var t,i=f("CLS",0),r=0,a=[],c=function(e){e.forEach((function(e){if(!e.hadRecentInput){var n=a[0],t=a[a.length-1];r&&e.startTime-t.startTime<1e3&&e.startTime-n.startTime<5e3?(r+=e.value,a.push(e)):(r=e.value,a=[e]);}})),r>i.value&&(i.value=r,i.entries=a,t());},u=s("layout-shift",c);u&&(t=d(e,i,b,n.reportAllChanges),p((function(){c(u.takeRecords()),t(!0);})),o((function(){r=0,i=f("CLS",0),t=d(e,i,b,n.reportAllChanges),l((function(){return t()}));})),setTimeout(t,0));})));},A={passive:!0,capture:!0},I=new Date,P=function(i,r){e||(e=r,n=i,t=new Date,k(removeEventListener),F());},F=function(){if(n>=0&&n<t-I){var r={entryType:"first-input",name:e.type,target:e.target,cancelable:e.cancelable,startTime:e.timeStamp,processingStart:e.timeStamp+n};i.forEach((function(e){e(r);})),i=[];}},M=function(e){if(e.cancelable){var n=(e.timeStamp>1e12?new Date:performance.now())-e.timeStamp;"pointerdown"==e.type?function(e,n){var t=function(){P(e,n),r();},i=function(){r();},r=function(){removeEventListener("pointerup",t,A),removeEventListener("pointercancel",i,A);};addEventListener("pointerup",t,A),addEventListener("pointercancel",i,A);}(n,e):P(n,e);}},k=function(e){["mousedown","keydown","touchstart","pointerdown"].forEach((function(n){return e(n,M,A)}));},D=[100,300],x=function(t,r){r=r||{},C((function(){var a,c=E(),u=f("FID"),l=function(e){e.startTime<c.firstHiddenTime&&(u.value=e.processingStart-e.startTime,u.entries.push(e),a(!0));},m=function(e){e.forEach(l);},h=s("first-input",m);a=d(t,u,D,r.reportAllChanges),h&&p(v((function(){m(h.takeRecords()),h.disconnect();}))),h&&o((function(){var o;u=f("FID"),a=d(t,u,D,r.reportAllChanges),i=[],n=-1,e=null,k(addEventListener),o=l,i.push(o),F();}));}));},U=[2500,4e3],V={},W=function(e,n){n=n||{},C((function(){var t,i=E(),r=f("LCP"),a=function(e){var n=e[e.length-1];n&&n.startTime<i.firstHiddenTime&&(r.value=Math.max(n.startTime-u(),0),r.entries=[n],t());},c=s("largest-contentful-paint",a);if(c){t=d(e,r,U,n.reportAllChanges);var m=v((function(){V[r.id]||(a(c.takeRecords()),c.disconnect(),V[r.id]=!0,t(!0));}));["keydown","click"].forEach((function(e){addEventListener(e,(function(){return setTimeout(m,0)}),!0);})),p(m),o((function(i){r=f("LCP"),t=d(e,r,U,n.reportAllChanges),l((function(){r.value=performance.now()-i.timeStamp,V[r.id]=!0,t(!0);}));}));}}));};

    var MetricData;
    (function (MetricData) {
        MetricData["FCP"] = "FCP";
        MetricData["LCP"] = "LCP";
        MetricData["FID"] = "FID";
        MetricData["CLS"] = "CLS";
    })(MetricData || (MetricData = {}));
    var Data;
    (function (Data) {
        Data["performance"] = "performance";
        Data["cache"] = "cache";
        Data["loading"] = "loading";
        Data["resourceFlow"] = "resourceFlow";
    })(Data || (Data = {}));

    function WebVitals(callback) {
        let data = {};
        let callbackCount = 0;
        w((metricData) => {
            data[MetricData.FCP] = {
                name: metricData.name,
                value: metricData.value,
                rating: metricData.rating,
            };
            callbackCount++;
            checkAndCallback();
        });
        S((metricData) => {
            data[MetricData.CLS] = {
                name: metricData.name,
                value: metricData.value,
                rating: metricData.rating,
            };
            callbackCount++;
            checkAndCallback();
        });
        W((metricData) => {
            data[MetricData.LCP] = {
                name: metricData.name,
                value: metricData.value,
                rating: metricData.rating,
            };
            callbackCount++;
            checkAndCallback();
        });
        x((metricData) => {
            data[MetricData.FID] = {
                name: metricData.name,
                value: metricData.value,
                rating: metricData.rating,
            };
            callbackCount++;
            checkAndCallback();
        });
        function checkAndCallback() {
            if (callbackCount === 4) {
                callback(data);
            }
        }
    }

    function cache() {
        const resourceDatas = performance.getEntriesByType('resource');
        let cacheHitQuantity = 0;
        resourceDatas.forEach((resourceData) => {
            if (resourceData.deliveryType === 'cache')
                cacheHitQuantity++;
            else if (resourceData.duration === 0 && resourceData.transferSize !== 0)
                cacheHitQuantity++;
        });
        const cacheHitRate = cacheHitQuantity !== 0 && resourceDatas.length !== 0 ? parseFloat((cacheHitQuantity / resourceDatas.length * 100).toFixed(2)) : 0;
        return {
            cacheHitQuantity,
            noCacheHitQuantity: resourceDatas.length - cacheHitQuantity,
            cacheHitRate: `${cacheHitRate}%`,
        };
    }

    class PerformanceTracker {
        constructor(options, reportTracker) {
            this.options = Object.assign(this.initDef(), options);
            this.data = {};
            this.reportTracker = reportTracker;
            this.performanceEvent();
        }
        performanceEvent() {
            if (this.options.loading)
                this.getloading();
            if (this.options.cache)
                this.getCache();
            if (this.options.resourceFlow)
                this.getResouceFlow();
            if (this.options.performance)
                this.getWebVitals();
            this.reportPerformance();
        }
        //默认设置
        initDef() {
            return {
                performance: true,
                cache: true,
                loading: true,
                resourceFlow: true
            };
        }
        /**
         * 获取dom流
         *
         */
        getResouceFlow() {
            this.data[Data.resourceFlow] = resourceFlow();
        }
        /**
         * 获取各类loading时间
         *
         */
        getloading() {
            this.data[Data.loading] = loadingData();
        }
        /**
         * 获取WebVitals指标
         *
         */
        getWebVitals() {
            WebVitals((data) => {
                this.data[Data.performance] = data;
                console.log("全部回调完成");
                this.reportPerformance();
            });
        }
        /**
         * 获取缓存
         *
         */
        getCache() {
            this.data[Data.cache] = cache();
        }
        reportPerformance() {
            this.reportTracker(this.data);
        }
    }

    class Tracker {
        // private userAgent
        constructor(options, aliyunOptions) {
            this.options = Object.assign(this.initDef(), options);
            this.aliyunOptions = aliyunOptions;
            // this.userAgent = getPageInformation()
            this.installTracker();
        }
        //默认设置
        initDef() {
            // 重写赋值
            window.history['pushState'] = createHistoryEvent('pushState');
            window.history['replaceState'] = createHistoryEvent('replaceState');
            return {
                sdkVersion: TrackerConfig.version,
                historyTracker: false,
                hashTracker: false,
                domTracker: false,
                Error: false,
                performance: false,
            };
        }
        /**
         * 事件捕获器
         * @param mouseEventList 事件列表
         * @param targetKey 这个值是后台定的
         * @param data
         */
        captureEvents(mouseEventList, targetKey, data) {
            mouseEventList.forEach((event, index) => {
                window.addEventListener(event, () => {
                    //一旦我们监听到我们就系统自动进行上报
                    this.reportTracker({
                        kind: 'stability',
                        trackerType: 'historyTracker',
                        event,
                        targetKey,
                        data,
                    });
                });
            });
        }
        //用来判断是否开启
        installTracker() {
            if (this.options.historyTracker) {
                this.captureEvents(['pushState', 'replaceState', 'popstate'], 'history-pv');
            }
            if (this.options.hashTracker) {
                this.captureEvents(['hashchange'], 'hash-pv');
            }
            if (this.options.Error) {
                this.error = new ErrorTracker({}, this.reportTracker.bind(this));
            }
            if (this.options.userAction) {
                this.userAction = new userAction({}, this.reportTracker.bind(this));
                // userActionTrackerClass.eventTracker();
                // if (this.options.domTracker) {
                //   userActionTrackerClass.Dom();
                // }
            }
            if (this.options.performance) {
                this.performance = new PerformanceTracker({}, this.reportTracker.bind(this));
            }
        }
        /**
         * 上报监控数据给后台
         * @param data 传入的数据
         */
        reportTracker(data) {
            //因为第二个参数BodyInit没有json格式
            const params = Object.assign({ data }, {
                currentTime: utcFormat(new Date().getTime()),
                userAgent: 'fds',
            });
            console.log(data, '传入的数据');
            console.log(params, '添加了其他数据之后的params');
            // 发送到自己的后台
            let headers = {
                type: 'application/x-www-form-urlencoded',
            };
            let blob = new Blob([JSON.stringify(params)], headers); //转化成二进制然后进行new一个blob对象,会把是"undefined"消除
            navigator.sendBeacon(this.options.requestUrl, blob);
            // 如果存在发送到阿里云中去
            if (this.aliyunOptions) {
                let { project, host, logstore } = this.aliyunOptions;
                getAliyun(project, host, logstore, params);
            }
        }
        /**
         * 手动上报
         */
        setTracker(data) {
            this.reportTracker(data);
        }
        /**
         * 用来设置用户id
         * @param uuid 用户id
         */
        setUserId(uuid) {
            this.options.uuid = uuid;
        }
        /**
         * 用来设置透传字段
         * @param extra 透传字段
         */
        setExtra(extra) {
            this.options.extra = extra;
        }
        /**
         * 用来设置应用ID
         * @param extra 透传字段
         */
        setAppId(appId) {
            this.appId = appId;
        }
    }

    return Tracker;

}));
