/*
---
description: Mootools version of Impromptu for modal like prompts and forms.

license: Dual licensed under the MIT and GPL licenses.

authors:
- Trent Richardson

provides: [Impromptu]

requires:
- Core

...
*/

var Impromptu = new Class({
	initialize: function(){
		return this;
	},
	
	version: 3.1,	
	
	show: function(message, options){
		options = Object.append(this.defaults, options);
		this.currentPrefix = options.prefix;
		var t = this;
		var ie6 = Browser.ie6;
		
		options.classes = options.classes.trim();
		if(options.classes != '')
			options.classes = ' '+ options.classes;
			
		//build the box and fade
		var msgbox = '<div class="'+ options.prefix +'box'+ options.classes +'" id="'+ options.prefix +'box">';
		if(options.useiframe && (($$('object, applet').length > 0) || ie6)) {
			msgbox += '<iframe src="javascript:false;" style="display:block;position:absolute;z-index:-1;" class="'+ options.prefix +'fade" id="'+ options.prefix +'fade"></iframe>';
		} else {
			if(ie6) {
				$$('select').each(function(obj){ 
					obj.setStyle('visibility','hidden');
				});
			}
			msgbox +='<div class="'+ options.prefix +'fade" id="'+ options.prefix +'fade"></div>';
		}
		msgbox += '<div class="'+ options.prefix +'" id="'+ options.prefix +'"><div class="'+ options.prefix +'container"><div class="';
		msgbox += options.prefix +'close">X</div><div id="'+ options.prefix +'states"></div>';
		msgbox += '</div></div></div>';
		
		var t_element = new Element('div', { html: msgbox }).getFirst();
		t_element.inject(document.body);
		var t_elementPrompt = t_element.getElementById(options.prefix);
		var t_elementFade = t_element.getElementById(options.prefix +'fade');
		
		this.element = t_element;
		this.elementPrompt = t_elementPrompt;
		this.elementFade = t_elementFade;

		//if a string was passed, convert to a single state
		if(message.constructor == String){
			message = {
				state0: {
					html: message,
				 	buttons: options.buttons,
				 	focus: options.focus,
				 	submit: options.submit
			 	}
		 	};
		}

		//build the states
		var states = "";
		
		Object.each(message, function(stateobj,statename){
			stateobj = Object.merge({ 
					buttons: ((stateobj.buttons != undefined)? null : t.defaults.state), 
					focus: ((stateobj.focus != undefined)? null : t.defaults.focus), 
					submit: ((stateobj.submit != undefined)? null : t.defaults.submit) 
				}, stateobj);
			message[statename] = stateobj;
			
			states += '<div id="'+ options.prefix +'_state_'+ statename +'" class="'+ options.prefix + '_state" style="display:none;"><div class="'+ options.prefix +'message">' + stateobj.html +'</div><div class="'+ options.prefix +'buttons">';
			Object.each(stateobj.buttons, function(v, k){
				if(typeof v == 'object')
					states += '<button name="' + options.prefix + '_' + statename + '_button' + v.title.replace(/[^a-z0-9]+/gi,'') + '" id="' + options.prefix + '_' + statename + '_button' + v.title.replace(/[^a-z0-9]+/gi,'') + '" value="' + v.value + '">' + v.title + '</button>';
				else states += '<button name="' + options.prefix + '_' + statename + '_button' + k + '" id="' + options.prefix +	'_' + statename + '_button' + k + '" value="' + v + '">' + k + '</button>';
			});
			states += '</div></div>';
			
		});
				
		//insert the states...
		this.elementPrompt.getElementById(options.prefix +'states').set('html', states).getFirst().setStyle('display','block');
		$$('.'+ options.prefix +'buttons:empty').each(function(v){
			v.setStyle('display','none'); 
		});
		
		//Events
		Object.each(message, function(stateobj, statename){
			var $state = $(options.prefix +'_state_'+ statename),
				btns = $state.getElements('.'+ options.prefix +'buttons button');
			if(btns.length){
			btns.each(function(btn){
				btn.addEvent('click',function(){				
					var msg = $state.getElement('.'+ options.prefix +'message');					
					var clicked = stateobj.buttons[btn.get('text')];
					
					if(clicked == undefined){
						for(var i in stateobj.buttons)
							if(stateobj.buttons[i].title == btn.get('text'))
								clicked = stateobj.buttons[i].value;
					}
					
					if(typeof clicked == 'object')
						clicked = clicked.value;
					
					var forminputs = {};
					
					//collect all form element values from all states
					$(options.prefix +'states').getElements('input[type=text], input[type=hidden], input:checked, select, textarea').each(function(input, i){
					
						var inputName = input.get('name');
						var inputValue = input.get('value');

						if (forminputs[inputName] === undefined) {
							forminputs[inputName] = inputValue;
						} else if (typeof forminputs[inputName] == Array || typeof forminputs[inputName] == 'object') {
							forminputs[inputName].push(inputValue);
						} else {
							forminputs[inputName] = [forminputs[inputName],inputValue];	
						} 
					});
					
					var close = stateobj.submit(clicked,msg,forminputs);
					if(close === undefined || close) {
						removePrompt(true,clicked,msg,forminputs);
					}
				});
			});
			btns[stateobj.focus].addClass(options.prefix +'defaultbutton');
			}
		});
		
		var ie6scroll = function(){
			this.element.setStyles({ top: $(window).getScroll().y });
		};
		
		var fadeClicked = function(){
			if(options.persistent){
				var i = 0;
				t_element.addClass(options.prefix +'warning');
				var intervalid = setInterval(function(){
					t_element.toggleClass(options.prefix +'warning');
					if(i++ > 1){
						clearInterval(intervalid);
						t_element.removeClass(options.prefix +'warning');
					}
				}, 100);
			}
			else {
				removePrompt();
			}
		};
		
		var keyPressEventHandler = function(e){
			var key = e.code;
			
			//escape key closes
			if(key==27) {
				fadeClicked();	
			}
			
			//constrain tabs
			if (key == 9){
				$inputels = t.getCurrentState().getElements('input[type!=hidden], select, textarea, button').filter(':enabled');
				
				var fwd = !e.shift && e.target == $inputels[$inputels.length-1];
				var back = e.shift && e.target == $inputels[0];
				if (fwd || back) {
				setTimeout(function(){ 
					if (!$inputels)
						return;
					var el = $inputels[back===true ? $inputels.length-1 : 0];

					if (el)
						el.focus();
				},10);
				return false;
				}
			}
		};
		
		var positionPrompt = function(){
			t_element.setStyles({
				position: (ie6) ? "absolute" : "fixed",
				height: $(window).getSize().y,
				width: "100%",
				top: (ie6)? $(window).getScroll().y : 0,
				left: 0,
				right: 0,
				bottom: 0
			});
			t_elementFade.setStyles({
				position: "absolute",
				height: $(window).getSize().y,
				width: "100%",
				top: 0,
				left: 0,
				right: 0,
				bottom: 0
			});
			t_elementPrompt.setStyles({
				position: "absolute",
				top: options.top,
				left: "50%",
				marginLeft: ((t_elementPrompt.getSize().x/2)*-1)
			});
		};

		var stylePrompt = function(){
			t_elementFade.setStyles({
				zIndex: options.zIndex,
				opacity: options.opacity
			});
			t_elementPrompt.setStyles({
				zIndex: options.zIndex+1
			});
			t_element.setStyles({
				zIndex: options.zIndex
			});
		};

		var removePrompt = function(callCallback, clicked, msg, formvals){
			t_elementPrompt.destroy();
			//ie6, remove the scroll event
			if(ie6) {
				$(window).removeEvent('scroll',ie6scroll);
			}
			$(window).removeEvent('resize',positionPrompt);
			
			new Fx.Tween(t_elementFade,{
				duration: options.overlayspeed,
				onComplete: function(){ 
					
					t_elementFade.destroy(); 
					if(callCallback) {
						options.callback(clicked,msg,formvals);
					}
					t_element.destroy();
					if(ie6 && !options.useiframe) {
						$$('select').each(function(obj){ 
							obj.setStyle('visibility','visible');
						});
					}
				}
			}).start('opacity', '0');
	
		};
		
		this.elementFade.setStyle('opacity',0);
		this.elementPrompt.setStyle('opacity',0);
		positionPrompt();
		stylePrompt();

		//ie6, add a scroll event to fix position:fixed
		if(ie6) {
			$(window).addEvent('scroll',ie6scroll);
		}
		
		this.elementFade.addEvent('click', fadeClicked);
		$(window).addEvent('resize', positionPrompt);
		//this.element.addEvents({'keydown': keyPressEventHandler, 'keypress': keyPressEventHandler});
		this.element.addEvent('keydown', keyPressEventHandler);
		$$('.'+ options.prefix +'close')[0].addEvent('click',removePrompt);
		
		//Show it
		new Fx.Tween(this.elementFade,{
			duration: options.overlayspeed,
			onComplete: options.loaded
		}).start('opacity', options.opacity);
		new Fx.Tween(this.elementPrompt,{
			duration: 'short',
			onComplete: function(){
				$$('button.'+ options.prefix +'defaultbutton')[0].focus();
				options.loaded();
			}
		}).start('opacity', '1');
		
		if(options.timeout > 0)
			setTimeout(this.close,options.timeout);
			
		return this;
	},// end initialize
	
	element: null,
	
	defaults: {
		prefix:'jqi',
		classes: '',
		buttons: {
			Ok: true
		},
	 	loaded: function(){

	 	},
	  	submit: function(){
	  		return true;
		},
	 	callback: function(){

	 	},
		opacity: 0.6,
	 	zIndex: 999,
	  	overlayspeed: 'normal',
	   	promptspeed: 'normal',
   		show: 'fadeIn',
	   	focus: 0,
	   	useiframe: false,
	 	top: "15%",
	  	persistent: true,
	  	timeout: 0,
	  	state: {
			html: '',
		 	buttons: {
		 		Ok: true
		 	},
		  	focus: 0,
		   	submit: function(){
		   		return true;
		   }
	  	}
	},
	
	currentPrefix: '',
	
	setDefaults: function(o) {
		Object.append(this.defaults, o);
	},
	
	setStateDefaults: function(o) {
		Object.append(this.defaults.state, o);
	},
	
	getStateContent: function(state) {
		return $(this.currentPrefix +'_state_'+ state);
	},
	
	getCurrentState: function(){
		var curr = null;
		$$('.'+ this.currentPrefix +'_state').each(function(el){
			if(el.getStyle('display').toLowerCase() != 'none' && el.getStyle('visibility').toLowerCase() != 'hidden'){
				curr = el;
			}
				
		});
		
		return curr;
	},
	
	getCurrentStateName: function(){
		var stateid = this.getCurrentState().get('id');
		return stateid.replace(this.currentPrefix +'_state_','');
	},
	
	goToState: function(state, callback) {
		var currState = this.getCurrentState();
		var toState = this.getStateContent(state);
		
		var currStateWrap = new Element('div', { styles: { overflow: 'hidden' } });
		var toStateWrap = new Element('div', { styles: { height: 0, overflow: 'hidden' } });
		
		currStateWrap.wraps(currState);
		toStateWrap.wraps(toState);
		
		new Fx.Morph(currStateWrap,{
				duration: 'normal',
				onComplete: function(){
					currState.setStyles({ display: 'none' });
				}
			}).start({
				'height': 0
			});
		
		toStateWrap.setStyles({ height: 0 });
		toState.setStyles({ display: 'block' });
		var toStateHeight = toState.getSize().y;
		var t_currentPrefix = this.currentPrefix;
		
		new Fx.Morph(toStateWrap,{
				duration: 'normal',
				onComplete: function(){ 
					
					toState.replaces(toStateWrap);
					currState.replaces(currStateWrap);
					
					var focusbtn = toState.getElement('.'+ t_currentPrefix +'defaultbutton');
					if(focusbtn) focusbtn.focus();
					
					if (typeof callback == 'function')
						callback();
				}
			}).start({
				height: toStateHeight
			});
	},
	
	nextState: function(callback) {
		var $next = this.getCurrentState().getNext();
		if($next){
			stateid = $next.get('id').replace(this.currentPrefix +'_state_','');
			this.goToState(stateid, callback);
		}
	},
	
	prevState: function(callback) {
		var $previous = this.getCurrentState().getPrevious();
		if($previous){
			stateid = $previous.get('id').replace(this.currentPrefix +'_state_','');
			this.goToState(stateid, callback);
		}
	},
	
	close: function() {
			
		new Fx.Tween($(this.currentPrefix +'box'),{
				duration: 'short',
				onComplete: function(){ 
					this.element.destroy();
				}
			}).start('opacity', '0');
	},
	
	toElement: function(){
		return this.element;
	}
});

$prompt = new Impromptu();

Element.implement({
	prompt: function(options){
		if(options == undefined) 
			options = {};
		
		$prompt.show(this.get('html'), options);
	}
});
