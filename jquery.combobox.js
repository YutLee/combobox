/**
 * combobox
 * Copyright 2013
 * Date 2013.11.11
 */
 
(function($, undefined) {

	var ComboBox = function() {},
		isFunction = $.isFunction,
		isArray = $.isArray,
		extend = $.extend,
		trim = $.trim,
		NS = '.gmComboBox',
		STATEFOCUSED = 'g-state-focused',
		STATESELECTED = 'g-state-selected',
		STATEDOWN = 'g-state-down',
		STATEUP = 'g-state-up';
		
	ComboBox.prototype = {
		init: function(element, options) {
			var that = this, result, item, isNotBlur = false;
			
			options = isArray(options) ? {dataSource: options} : options;
			
			options = that.options = extend({}, that.options, options);
			that.element = element;
			options.placeholder = options.placeholder || element.attr('placeholder');
	
			that.status = false;
			that._create();
			
			item = that.popup.find('li');
			
			$(window).bind('scroll' + NS, function(e) {
				that.close();
			});
			
			that.popup.find('ul').bind('focus' + NS, function(e) {
				isNotBlur = true;
			}).bind('blur' + NS, function(e) {
				isNotBlur = false;
			});
			
			item.bind('click' + NS, function(e) {
				var val = that.textInput.val(),
					text = $(this).text(),
					idx = $(this).index();
					
				that.text(text);
				console.log($(this).data('val'));
				element.val($(this).data('val'));
				
				$(this).addClass(STATESELECTED).siblings('.' + STATESELECTED).removeClass(STATESELECTED);
				
				e = extend({}, e, {item: idx});
				
				if(isFunction(that.options.select)) {
					that.options.select.call(that, e);
				} 
				
				that.close();
				e.stopPropagation();
			});
			
			that.down.bind('click' + NS, function(e) {
				if(!that.status) {
					that.open();
					that.textInput.focus();
				}else {
					that.close();
				}
				e.stopPropagation();
			}).bind('focus' + NS, function(e) {
				isNotBlur = true;
			}).bind('blur' + NS, function(e) {
				isNotBlur = false;
			});
			
			that.textInput.bind('focus' + NS, function(e) {
				that.target.addClass(STATEFOCUSED);
				that.olderText = $(this).val();
			}).bind('blur' + NS, function(e) {
				var currentText = $(this).val();
				that.target.removeClass(STATEFOCUSED);
				that.play = setTimeout(function() {
					if(!isNotBlur) {
						that.close();
					}
					e = extend({}, e, {olderText: that.olderText, currentText: currentText});
					if(isFunction(that.options.change) && that.olderText !== currentText) {
						that.options.change.call(that, e);
					} 
				}, 5);
				//that.close();
			}).bind('keydown' + NS, function(e) {
				var next = e.keyCode === 40 ? true : false,
					prev = e.keyCode === 38 ? true : false,
					enter = e.keyCode === 13 ? true : false,
					esc = e.keyCode === 27 ? true : false,
					current = that.popup.find('.' + STATESELECTED),
					prevItem,
					nextItem;
		
				current = current.length > 0 ? current : that.popup.find('.' + STATEFOCUSED);
				prevItem = current.prev();
				nextItem = current.next();
				
				if(esc) {
					that.close();
				}
				
				if(enter) {
					//that.select();
					current.click();
				}
				if(prev && prevItem.length > 0) {
					prevItem.addClass(STATESELECTED)
						.siblings('.' + STATESELECTED).removeClass(STATESELECTED).end()
						.siblings('.' + STATEFOCUSED).removeClass(STATEFOCUSED);
					that.text(prevItem.text());
				}
				if(next && nextItem.length > 0) {
					nextItem.addClass(STATESELECTED)
						.siblings('.' + STATESELECTED).removeClass(STATESELECTED).end()
						.siblings('.' + STATEFOCUSED).removeClass(STATEFOCUSED);
					that.text(nextItem.text());
				}
				if(enter || prev || next) {
					e.preventDefault();
				}
			}).bind('keyup' + NS, function(e) {
				var next = e.keyCode === 40 ? true : false,
					prev = e.keyCode === 38 ? true : false,
					enter = e.keyCode === 13 ? true : false,
					esc = e.keyCode === 27 ? true : false;
				if(next || prev || enter) {return false;}
				result = that.select($(this).val()); 
				if(result && !esc) {
					that.open();
				}else {
					that.close();
				}
			});
			
			if(that.options.index >= 0) {
				item.eq(that.options.index).click();
			}
		},
		options: {
			name: 'ComboBox',
			placeholder: '',
			height: 100,
			dataTextField: '',
            dataValueField: '',
			suggest: false
		},
		_create: function() {
			var that = this,
				el = that.element,
				name = el.attr('name'),
				i = 0,
				len = that.options.dataSource.length,
				box = $('<span class="g-combobox" tabindex="-1"></span>'),
				down = $('<span class="g-select" tabindex="-1"><span class="g-icon"></span></span>'),
				popup = $('<div class="g-popup" style="overflow:auto;"><ul tabindex="-1"></ul></div>');
			
			//el.hide().wrap(box);
			//box.after(el);
			that.target = el.hide().wrap(box).closest('span');
			that.textInput = $('<input type="text" />').addClass('g-input').appendTo(that.target);
			that.down = down.appendTo(that.target);
			that.textInput.attr('placeholder', that.options.placeholder);
			if(name && trim(name) !== '') {
				that.textInput.attr('name', name + '_input');
			}
			that.popup = popup.appendTo('body').hide().css('position', 'absolute');
			that.optionSize = len;
			
			for(; i < len; i++) {
				$('<li>' + that.options.dataSource[i][that.options.dataTextField] + '</li>').appendTo(that.popup.children('ul')).data('val', that.options.dataSource[i][that.options.dataValueField]);
			}
		},
		_position: function() {
			var that = this,
				offset = that.target.offset(),
				width = that.target.outerWidth() - parseInt(that.popup.css('border-left-width'), 10) * 2,
				top = offset.top + that.target.outerHeight(),
				pos;
				
			that.popup.css({display: 'block', 'visibility': 'hidden'});
			
			if($(window).height() + $(window).scrollTop() > top + that.popup.outerHeight()) {
				top = top;
				that.target.addClass(STATEDOWN);
			}else if(offset.top - $(window).scrollTop() >= that.popup.outerHeight()) {
				top = offset.top - that.popup.outerHeight();
				that.target.addClass(STATEUP);
			}else {
				top = top;
				that.target.addClass(STATEDOWN);
			}
			
			that.popup.css({display: 'none', 'visibility': ''});
			
			pos = {top: top, left: offset.left, width: width, 'max-height': that.options.height};	
			return pos;
			
		},
		search: function() {
		
		},
		select: function(str) {
			var that = this,
				now,
				result = false,
				reg = new RegExp(str);
			if(str === '') {
				return false;
			}
			for(var i = 0; i < that.optionSize; i++) {
				now = that.popup.find('li').eq(i);
				if(reg.test(now.text())) {
					result = true;
					now.removeClass(STATESELECTED).addClass(STATEFOCUSED).siblings('.' + STATEFOCUSED).removeClass(STATEFOCUSED).siblings('.' + STATESELECTED).removeClass(STATESELECTED);
					break;
				}
			}
			if(!result) {
				that.popup.find('li').eq(0).addClass(STATEFOCUSED).siblings('.' + STATEFOCUSED).removeClass(STATEFOCUSED);
			}
			return result;
		},
		text: function(text) {
			var that = this;
			if(text === undefined) {
				return that.textInput.val();
			}else {
				that.textInput.val(text);
			}
		},
		value: function(value) {
			var that = this;
			if(value === undefined) {
				return that.element.val();
			}else {
				that.element.val(text);
			}
		},
		open: function() {
			var that = this,
				el = that.element;
			
			that.status = true;
			that.popup.css(that._position()).show().addClass(STATEFOCUSED);
			if(!that.select(that.text())) {
				that.popup.find('li').eq(0).addClass(STATEFOCUSED);
			}
		},
		close: function() {
			var that = this,
				el = that.element;
			that.status = false;
			that.popup.hide().removeClass(STATEFOCUSED);
			that.target.removeClass(STATEDOWN + ' ' + STATEUP);

			if(!that.select(that.text())) {
				that.popup.find('.' + STATESELECTED).removeClass(STATESELECTED).end()
						.find('.' + STATEFOCUSED).removeClass(STATEFOCUSED);
			}

			clearTimeout(that.play);
			
		},
		destroy: function() {
			var that = this,
				element = that.element;

		}
	};
	
	$.fn.comboBox = function(options) {
		this.each(function() {
			var combobox = new ComboBox();
			combobox.init($(this), options);
		});
	};
	
})(jQuery);