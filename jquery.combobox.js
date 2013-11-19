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
			
			function setScrollTop(item) {
				var top = (that.options.height - (item.offset().top + item.outerHeight(true) + that.popup.scrollTop() - that.popup.offset().top)) * -1;
				that.popup.scrollTop(top);
			}
			
			$(window).bind('scroll' + NS, function(e) {
				that.close();
			});
			
			that.popup.find('ul').bind('focus' + NS, function(e) {
				isNotBlur = true;
			}).bind('blur' + NS, function(e) {
				isNotBlur = false;
			});
			
			that.popup.delegate('li', 'click' + NS, function(e) {
				var val = that.input.val(),
					t = $(this),
					text = t.text(),
					idx = t.index();
					
				that.text(text);
				that.value(t.data('val'));
				
				t.addClass(STATESELECTED).siblings('.' + STATESELECTED).removeClass(STATESELECTED);
				
				e = extend({}, e, {item: t});
				
				if(isFunction(that.options.select)) {
					that.options.select.call(that, e);
				} 
				
				e = extend({}, e, {olderText: that.olderText, currentText: that.text()});
				if(isFunction(that.options.change) && that.olderText !== that.text()) {
					that.options.change.call(that, e);
				} 
				
				that.close();
				e.stopPropagation();
			});
			
			that.down.bind('click' + NS, function(e) {
				if(!that.status) {
					that.open();
					that.input.focus();
				}else {
					that.close();
				}
				e.stopPropagation();
			}).bind('focus' + NS, function(e) {
				isNotBlur = true;
			}).bind('blur' + NS, function(e) {
				isNotBlur = false;
			});
			
			that.input.bind('focus' + NS, function(e) {
				that.target.addClass(STATEFOCUSED);
				that.olderText = that.text();
			}).bind('blur' + NS, function(e) {
				var currentText = $(this).val();
				that.target.removeClass(STATEFOCUSED);
				that.play = setTimeout(function() {
					if(!isNotBlur) {
						e = extend({}, e, {olderText: that.olderText, currentText: currentText});
						if(!that.search(currentText)) {
							that.value('');
						}
						if(isFunction(that.options.change) && that.olderText !== currentText) {
							that.options.change.call(that, e);
						} 
						that.close();
					}
				}, 5);
				//that.close();
			}).bind('keydown' + NS, function(e) {
				var next = e.keyCode === 40 ? true : false,
					prev = e.keyCode === 38 ? true : false,
					enter = e.keyCode === 13 ? true : false,
					esc = e.keyCode === 27 ? true : false,
					current = that.popup.find('.' + STATESELECTED),
					len = that.popup.find('li').length,
					prevItem,
					nextItem;
		
				current = current.length > 0 ? current : that.popup.find('.' + STATEFOCUSED);
				
				function getPrev(item) {
					if(item.length > 0) {
						if(item.css('display') !== 'none') {
							prevItem = item;
							return false;
						}else {
							getPrev(item.prev());
						}
					}else {
						return false;
					}
				}
				
				function getNext(item) {
					if(item.length > 0) {
						if(item.css('display') !== 'none') {
							nextItem = item;
							return false;
						}else {
							getNext(item.next());
						}
					}else {
						return false;
					}
				}

				getPrev(current.prev());
				getNext(current.next());
				
				if(esc) {
					that.close();
				}
				
				if(enter) {
					//that.select();
					current.click();
				}
				if(prev && prevItem) {
					prevItem.addClass(STATESELECTED)
						.siblings('.' + STATESELECTED).removeClass(STATESELECTED).end()
						.siblings('.' + STATEFOCUSED).removeClass(STATEFOCUSED);
					setScrollTop(prevItem);
					that.text(prevItem.text());
				}
				if(next && nextItem) {
					nextItem.addClass(STATESELECTED)
						.siblings('.' + STATESELECTED).removeClass(STATESELECTED).end()
						.siblings('.' + STATEFOCUSED).removeClass(STATEFOCUSED);
					setScrollTop(nextItem);
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
				result = that.filter($(this).val()); 
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
			height: 200,
			dataTextField: '',
            dataValueField: '',
			ignoreCase: true,
			suggest: false
		},
		_create: function() {
			var that = this,
				el = that.element,
				name = el.attr('name'),
				box = $('<span class="g-combobox" tabindex="-1"></span>'),
				down = $('<span class="g-select" tabindex="-1"><span class="g-icon"></span></span>'),
				popup = $('<div class="g-popup" style="overflow:auto;"><ul tabindex="-1"></ul></div>');
			
			that.target = el.hide().wrap(box).closest('span');
			that.input = $('<input type="text" autocomplete="off" />').addClass('g-input').appendTo(that.target);
			that.down = down.appendTo(that.target);
			that.input.attr('placeholder', that.options.placeholder);
			if(name && trim(name) !== '') {
				that.input.attr('name', name + '_input');
			}
			that.popup = popup.appendTo('body').hide().css('position', 'absolute');
						
			that.setDataSource(that.options.dataSource);
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
		setDataSource: function(data) {
			var that = this,
				i = 0,
				len = data.length;
			that.optionSize = len;
			that.ul = that.popup.children('ul').empty();
			that.value('');
			that.text('');
			for(; i < len; i++) {
				$('<li>' + data[i][that.options.dataTextField] + '</li>').appendTo(that.ul).data('val', data[i][that.options.dataValueField]);
			}
		},
		select: function(obj) {
			var that = this;
			that.ul.children().eq(obj).click();
		},
		search: function(text) {
			var that = this,
				i = 0,
				result = false,
				len = that.options.dataSource.length;
				
			while(i < len) {
				if(text === that.options.dataSource[i][that.options.dataTextField]) {
					result = true;
					break;
				}
				i += 1;
			}
			return result;
		},
		filter: function(str) {
			var that = this,
				now,
				first = null,
				result = false,
				ignoreCase = that.options.ignoreCase ? 'i' : '';
				reg = new RegExp(str, ignoreCase);
				
			that.popup.find('li').hide();
			
			if(str === '') {
				that.popup.find('li').show().eq(0).removeClass(STATESELECTED).addClass(STATEFOCUSED).siblings('.' + STATEFOCUSED).removeClass(STATEFOCUSED).siblings('.' + STATESELECTED).removeClass(STATESELECTED);;
				return true;
			}
			
			for(var i = 0; i < that.optionSize; i++) {
				now = that.popup.find('li').eq(i);
				if(reg.test(now.text())) {
					result = true;
					if(first === null) {
						first = i;
						now.removeClass(STATESELECTED).addClass(STATEFOCUSED).siblings('.' + STATEFOCUSED).removeClass(STATEFOCUSED).siblings('.' + STATESELECTED).removeClass(STATESELECTED);
					}
					now.show();
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
				return that.input.val();
			}else {
				that.input.val(text);
			}
		},
		value: function(value) {
			var that = this;
			if(value === undefined) {
				return that.element.val();
			}else {
				that.element.val(value);
			}
		},
		open: function() {
			var that = this,
				el = that.element;
			
			that.status = true;
			that.popup.css(that._position()).show().addClass(STATEFOCUSED);
			if(!that.filter(that.text())) {
				that.popup.find('li').eq(0).addClass(STATEFOCUSED);
			}
		},
		close: function() {
			var that = this,
				el = that.element;
			that.status = false;
			that.popup.hide().removeClass(STATEFOCUSED);
			that.target.removeClass(STATEDOWN + ' ' + STATEUP);

			if(!that.filter(that.text())) {
				that.popup.find('.' + STATESELECTED).removeClass(STATESELECTED).end()
						.find('.' + STATEFOCUSED).removeClass(STATEFOCUSED);
			}

			clearTimeout(that.play);
			
		},
		destroy: function() {
			var that = this,
				element = that.element;
				
			element.removeData('gComboBox');
			element.insertAfter(that.target);
			that.target.remove();
			that.popup.remove();
			that.down.remove();
		}
	};
	
	$.fn.comboBox = function(options) {
		this.each(function() {
			var combobox = new ComboBox();
			$(this).data('gComboBox', combobox);
			combobox.init($(this), options);
		});
	};
	
})(jQuery);