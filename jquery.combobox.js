/**
 * combobox
 * Copyright 2013
 * Date 2013.11.11
 */
 
(function($, undefined) {

	var ComboBox = function(element, options) {
			this.init(element, options);
			element.data(this.options.name, this);
		},
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

			if(that.element.data('gComboBox')) {
				that.destroy();
			}
	
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
			
			that.popup.bind('focus' + NS, function(e) {
				isNotBlur = true;
			}).bind('blur' + NS, function(e) {
				that.close();
				isNotBlur = false;
			});
			
			that.popup.delegate('li', 'click' + NS, function(e) {
				var val = that.input.val(),
					t = $(this),
					text = t.text(),
					oldIndex = that.currentIndex,
					idx = t.index();
				
				e = extend({}, e, {selectIndex: idx, selectValue: t.data('val'), selectText: text});				
				if(isFunction(that.options.select)) {
					var notChange = that.options.select.call(that, e);
					if(notChange === false) {
						that.text(that.oldText);
						that.close();							
						return false;	
					} 
				} 
				
				if(oldIndex !== idx) {
					that.text(text);
					that.value(t.data('val'));
					that.currentIndex = idx;
					t.addClass(STATESELECTED).siblings('.' + STATESELECTED).removeClass(STATESELECTED);
					e = extend({}, e, {item: t, oldText: that.oldText, currentText: that.text()});
					if(isFunction(that.options.change)) {
						that.options.change.call(that, e);
					}
				} 
				
				that.close();
				e.stopPropagation();
			});
			
			that.down.bind('click' + NS, function(e) {
				e.stopPropagation();
				that.suggest = false;
				var s = new Date().getTime();
				if(!that.status) {
					that.open();
					that.input.focus();
					console.log('openTime:' + (new Date().getTime() - s));
				}else {
					that.close();
					console.log('closeTime:' + (new Date().getTime() - s));
				}
			}).bind('focus' + NS, function(e) {
				isNotBlur = true;
			}).bind('blur' + NS, function(e) {
				isNotBlur = false;
			});
			
			that.input.bind('focus' + NS, function(e) {
				that.target.addClass(STATEFOCUSED);
				that.oldText = that.text();
			}).bind('blur' + NS, function(e) {
				var currentText = $(this).val(),
					search = that.search(currentText),
					oldIndex = that.currentIndex,
					idx = search[1];
				that.target.removeClass(STATEFOCUSED);
				that.play = setTimeout(function() {
					
					if(!isNotBlur) {
						if(oldIndex !== idx) {
							that.currentIndex = idx;
							e = extend({}, e, {oldText: that.oldText, currentText: currentText});
							if(!search[0]) {
								that.value(search[1]);
							}else {
								that.value(that.popup.find('li').eq(search[1]).data('val'));
							}
							if(isFunction(that.options.change)) {
								that.options.change.call(that, e);
							}
						} 
						that.close();
					}
				}, 5);
			}).bind('keydown' + NS, function(e) {
				var next = e.keyCode === 40 ? true : false,
					prev = e.keyCode === 38 ? true : false,
					enter = e.keyCode === 13 ? true : false,
					esc = e.keyCode === 27 ? true : false,
					current = that.popup.find('.' + STATESELECTED),
					len = that.optionSize,
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
					
				that.suggest = that.options.suggest;
				if(next || prev || enter) {return false;}
				result = that.filter($(this).val()); 
				if(result && !esc) {
					that.open();
				}else {
					that.close();
				}
			});

		},
		options: {
			name: 'gComboBox',
			placeholder: '',
			height: 200,
			dataTextField: '',
            dataValueField: '',
			ignoreCase: true,
			suggest: true
		},
		_create: function() {
			var that = this,
				el = that.element,
				name = el.attr('name'),
				box = $('<span class="g-combobox" tabindex="-1"></span>'),
				down = $('<span class="g-select" tabindex="-1"><span class="g-icon"></span></span>'),
				popup = $('<div class="g-popup" tabindex="-1" style="overflow:auto;"><ul></ul></div>');
			
			that.target = el.hide().wrap(box).closest('span');
			that.target.width(el.width());
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
				wh = $(window).height(),
				wst = $(window).scrollTop(),
				popupHeight = wh,
				pos;

			if(that.optionSize < 200) {
				popupHeight = that.popup.outerHeight();
			}
				
			that.popup.css({display: 'block', 'visibility': 'hidden'});
			
			if(wh + wst > top + popupHeight) {
				that.target.addClass(STATEDOWN);
			}else if(offset.top - wst >= popupHeight) {
				top = offset.top - popupHeight;
				that.target.addClass(STATEUP);
			}else {
				that.target.addClass(STATEDOWN);
			}
			
			that.popup.css({display: 'none', 'visibility': ''});
			
			pos = {top: top, left: offset.left, width: width, 'max-height': that.options.height};	
			return pos;
			
		},
		setDataSource: function(data) {
			var that = this,
				i = 0,
				len = data.length,
				itemsHtml = '';
			that.optionSize = len;
			that.ul = that.popup.children('ul').empty();
			that.value('');
			that.text('');
			that.itemsText = [];
			for(; i < len; i++) {
				var ds = data[i],
					text, value;
				if(ds && !$.isEmptyObject(ds)) {
					text = ds[that.options.dataTextField];
					value= ds[that.options.dataValueField];
					if(i === that.options.index) {
						that.value(value);
						that.text(text);
						that.currentIndex = i;
					}
					itemsHtml += '<li data-val=' + value + '>' + text + '</li>';
					that.itemsText.push(text);
					// $('<li>').html(text).appendTo(that.ul).data('val', value);
				}
			}
			that.ul.html(itemsHtml);
			that.itemsHtml = itemsHtml;
			that.items = that.ul.find('li');
			that.lastFocus = that.items.eq(0);
		},
		select: function(obj) {
			var that = this;
			that.ul.children().eq(obj).click();
		},
		search: function(text) {
			var that = this,
				i = 0,
				result = [false, null],
				len = that.optionSize;
				
			while(i < len) {
				if(text === that.options.dataSource[i][that.options.dataTextField]) {
					result = [true, i];
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
				ignoreCase = that.options.ignoreCase ? 'i' : '',
				reg = new RegExp(str, ignoreCase),
				items = that.items,
				i, 
				itemsHtml = '';
				
			for(i = 0; i < that.optionSize; i++) {
				var ds = that.options.dataSource[i],
					text, value;
				if(ds && !$.isEmptyObject(ds)) {
					text = ds[that.options.dataTextField];
					value= ds[that.options.dataValueField];
					if(reg.test(text)) {
						result = true;
						var focused = '';
						if(first === null) {
							first = i;
							focused = ' class="' + STATEFOCUSED + '"';
						}
						itemsHtml += '<li' + focused +' data-val=' + value + '>' + text + '</li>';
					}
				}
			}

			that.ul.empty().html(itemsHtml);
			that.items = that.ul.children('li');
			if(!result) {
				that.items.eq(0).addClass(STATEFOCUSED);
			}
			if(!that.suggest) {that.items.css('display', 'block');}

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
				
			that.suggest = that.options.suggest;
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
				element = that.element,
				oldData = element.data(that.options.name);

			oldData.popup.remove();
			that.element = element.insertAfter(oldData.target);
			that.element.prev().remove();
			that.element.removeData(that.options.name);
		}
	};
	
	$.fn.comboBox = function(options) {
		$(this).each(function() {
			new ComboBox($(this), options);
		});
	};
	
})(jQuery);