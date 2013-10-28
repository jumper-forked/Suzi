(function(window, document) {

$(document).ready(function(e) {
	$html.addClass('jquery');
	
	placeholder.init();
	forms.init();
	slider.init();
	tabs.init();
	accordion.init();
	
	$('img.rwd').rwdImages({
		display: 'block'
	});
});

var html = document.documentElement,
	$html = $(html),
	actualFontSize = 16,
	baseFontSize = 16,
	multiplier;

var trackEvent = function(campaign, action, label) {
	var clean = function(str) {
		return str.toString().replace(/\s|'|"/g, '-')
	}
	
	if (typeof(_gaq) !== 'undefined')
		_gaq.push(['_trackEvent', clean(campaign), clean(action), clean(label)]);
};

var viewportSize = {
	height: function() {
		return html.clientHeight ? html.clientHeight : window.innerHeight;
	},
	width: function() {
		return html.clientWidth ? html.clientWidth : window.innerWidth;
	},
	multiplier: function() {
		if (window.getComputedStyle)
			actualFontSize = parseInt(window.getComputedStyle(html).getPropertyValue('font-size'));
				
		return actualFontSize / baseFontSize;
	}
};

var cookie = {
	set: function(name, value, days) {
		var expires = '';
		if (days) {
			var date = new Date();
			date.setTime(date.getTime() + (days*24*60*60*1000));
			expires = '; expires=' + date.toGMTString();
		}
		document.cookie = name + '=' + value + expires + '; path=/';
	},
	read: function(name) {
		var nameEQ = name + "=",
			ca = document.cookie.split(';');
		
		for (var i=0; i < ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0) === ' ')
				c = c.substring(1, c.length);
			
			if (c.indexOf(nameEQ) === 0)
				return c.substring(nameEQ.length, c.length);
		}
		return null;
	},
	erase: function(name) {
		cookie.set(name, '', -1);
	}
};

var placeholder = {
	init: function() {
		var pl = 'placeholder';
		
		if (!Modernizr.input.placeholder) {
			var $placeholder = $('['+pl+']');
			
			$placeholder.focus(function() {
				var input = $(this);
				if (input.val() == input.attr(pl))
					input.val('').removeClass(pl);
			}).blur(function() {
				var input = $(this);
				if (input.val() == '' || input.val() == input.attr(pl))
					input.addClass(pl).val(input.attr(pl));
			}).blur();
			
			$placeholder.parents('form').on('submit', function() {
				$(this).find('['+pl+']').each(function() {
					var $input = $(this);
					if ($input.val() == $input.attr(pl))
						$input.val('');
				});
			});
		}
		
		$html.addClass(pl);
	}
};

var forms = {
	requiredFields: [],
	
	init: function() {
		var $forms = $('form');
		
		$forms.each(function(index) {
			var $this = $(this);
			forms.requiredFields[index] = $this.find('[required]');
			
			$this.on('submit', function() {
				return forms.validate($this, index);
			});
		});
	},
	validate: function(form, index) {
		var $requireds = $(forms.requiredFields[index]),
			errors = false,
			tested = 'tested';
		
		$requireds.removeClass('form_error').removeClass(tested);
		
		$requireds.each(function() {
			var $this = $(this);
			
			if ($this.is('[type="radio"], [type="checkbox"]') && !$this.hasClass(tested)) {
				var name = $this.attr('name'),
					$radioChecks = $requireds.filter('[name="' + name + '"]');
				
				if (!$radioChecks.is(':checked')) {
					$radioChecks.addClass('form_error');
					$this.attr('aria-invalid', false);
				}
				
				$radioChecks.addClass(tested);
			}
			
			if ($.trim($this.val()).length === 0) {
				$this.addClass('form_error');
				$this.attr('aria-invalid', false);
				errors = true;
			}
		});
		
		$requireds.filter('form_error' + ':first').focus();
		
		return !errors;
	}
};

var slider = {
	swipejs: Modernizr.csstransforms && !(layoutEngine.vendor === 'ie' && layoutEngine.version === 9),
	$imagesLazy: [],
	
	init: function() {
		var $sliderParent = $('.carousel');
		
		if ($sliderParent.length) {
			$sliderParent.each(function(index) {
				var $this = $(this),
					$slider = $this.find('.slider'),
					$slides = $slider.find('> li'),
					slidesCount = $slides.length,
					globalPos = 0,
					isComplete = false,
					isVisible = false,
					carouselID = 'carouselid-' + window.location.pathname + '-' + index,
					carouselCookie = cookie.read(carouselID),
					circular = $this.data('circular') === false ? false : true;
				
				if (slider.swipejs && circular) {
					$slides.eq(0).clone().appendTo($slider);
					$slides.eq(slidesCount - 1).clone().prependTo($slider);
					$slides = $slider.find('> li'),
					slidesCount = slidesCount + 2;
				}
				
				if (carouselCookie)
					globalPos = parseInt(carouselCookie);
				
				if (slider.swipejs && circular && globalPos === 0)
					globalPos = 1;
				
				slider.$imagesLazy[index] = $slides.find('[data-src]');
				
				if (slidesCount === 1) {
					slider.lazyLoad(slider.$imagesLazy[index].eq(globalPos), index, globalPos, slidesCount);
					
					var $feature = $this.find('.inner');
					
					$slides.css('visibility', 'visible');
					$feature.css('visibility', 'visible');
				}
				else {
					var li = '',
						interval = false,
						nav = true,
						pager = true,
						speed = 300;
					
					slider.lazyLoad(slider.$imagesLazy[index].eq(globalPos), index, globalPos, slidesCount);
					
					if (parseInt($this.data('interval')))
						interval = parseInt($this.data('interval') * 1000);
					
					if ($this.data('nav') === false) {
						nav = false;
					}
					else {
						var $navPrev = $('<a href="#previous" class="nav prev"><span>Previous</span></a>'),
							$navNext = $('<a href="#next" class="nav next"><span>Next</span></a>');
					}
					
					if ($this.data('pager') === false)
						pager = false;
					else
						var $navPager = $('<ul class="nav_pager reset menu" />');
					
					if (nav)
						$this.append($navPrev).append($navNext);
					
					if (pager)
						$this.append($navPager);
					
					if (parseInt($this.data('speed')))
						speed = parseInt($this.data('speed'));
					
					$this.addClass('multiple');
					
					if (slider.swipejs) {
						if (pager) {
							for (var i = 1; i <= slidesCount; i++) {
								li += '<li><a href="#slide-' + i + '">Slide ' + i + '</a></li>';
							}
							
							$navPager.append(li);
							var $navPagerLi = $navPager.find('li'),
								$navPagerA = $navPager.find('a');
							
							if (circular) {
								$navPagerLi.eq(0).hide();
								$navPagerLi.eq(slidesCount - 1).hide();
							}
						}
						
						var $feature = $this.find('.inner');
						
						var carousel = new Swipe($feature[0], {
							circular: circular,
							speed: speed,
							
							complete: function() {
								this.slide(globalPos);
								isComplete = true;
							},
							
							touchCallback: function() {
								stopCarousel();
							},
							
							callback: function(e, pos) {
								if (isComplete && !isVisible) {
									isVisible = true;
									$slides.css('visibility', 'visible');
									$feature.css('visibility', 'visible');
								}
								
								$slides
									.attr('aria-hidden', true)
									.eq(pos)
									.attr('aria-hidden', false);
								
								slider.lazyLoad(slider.$imagesLazy[index].eq(pos));
								
								if (pos > globalPos) {
									if (pos < slidesCount - 1) {
										slider.lazyLoad(slider.$imagesLazy[index].eq(pos + 1));
										if (circular && pos === slidesCount - 2 && globalPos === 1) {
											slider.lazyLoad(slider.$imagesLazy[index].eq(pos - 1));
										}
									}
									else if (pos === slidesCount - 1 && globalPos === 0)
										slider.lazyLoad(slider.$imagesLazy[index].eq(pos - 1));
								}
								else if (pos < globalPos) {
									if (pos === 0) {
										if (globalPos > 1)
											slider.lazyLoad(slider.$imagesLazy[index].eq(pos + 1));
										else
											slider.lazyLoad(slider.$imagesLazy[index].eq(pos - 1));
									}
									else if (circular && pos === 1)
										slider.lazyLoad(slider.$imagesLazy[index].eq(pos - 1));
									else if (pos > 1) {
										slider.lazyLoad(slider.$imagesLazy[index].eq(pos - 1));
									}
								}
								
								if (pager) {
									$navPagerLi
										.removeClass('current')
										.eq(pos).addClass('current');
								}
								
								if (!interval)
									trackEvent('Website', 'Carousel', 'Slide ' + (pos + 1));
								
								globalPos = pos;
								cookie.set(carouselID, globalPos);
							}
						});
						
						$this.addClass('swipejs');
						
						var stopCarousel = function() {
							if (interval) {
								window.clearTimeout(timer);
								interval = false;
							}
						};
						
						if (nav) {
							$navPrev.on('click', function(e) {
								e.preventDefault();
								
								carousel.prev();
								stopCarousel();
							});
							
							$navNext.on('click', function(e) {
								e.preventDefault();
								
								carousel.next();
								stopCarousel();
							});
						}
						
						if (pager) {
							$navPagerA.each(function(idx) {
								var i = idx;
								$(this).on('click', function(e) {
									e.preventDefault();
									
									slider.lazyLoad(slider.$imagesLazy[index].eq(i));
									carousel.slide(i);
									
									$navPagerLi.removeClass('current');
									$(this).parent().addClass('current');
									
									stopCarousel();
								});
							});
						}
						
						var autoCarousel = function() {
							carousel.next();
						};
						
						if (interval) {
							timer = window.setInterval(autoCarousel, interval);
							var $tile = $this.find('.tile');
							
							$tile.hover(
								function(e) {
									e.stopPropagation();
									if (interval)
										window.clearTimeout(timer);
								},
								function(e) {
									e.stopPropagation();
									if (interval)
										timer = window.setInterval(autoCarousel, interval);
								}
							);
						}
					}
					else {
						var $feature = $this.find('.slider'),
							widthOverride = 'width: 100% !important',
							
							cycleOpts = {
								activePagerClass: 'current',
								cleartypeNoBg: true,
								fx: 'scrollHorz',
								speed: speed,
								startingSlide: globalPos,
								timeout: interval,
								after: function(curr, next, opts) {
									var pos = opts.currSlide;
									
									slider.lazyLoad(slider.$imagesLazy[index].eq(pos));
									
									if (pos > globalPos) {
										if (pos < slidesCount - 1)
											slider.lazyLoad(slider.$imagesLazy[index].eq(pos + 1));
										else if (pos === slidesCount - 1 && globalPos === 0)
											slider.lazyLoad(slider.$imagesLazy[index].eq(pos - 1));
									}
									else if (pos < globalPos) {
										if (pos === 0) {
											if (globalPos > 1)
												slider.lazyLoad(slider.$imagesLazy[index].eq(pos + 1));
											else
												slider.lazyLoad(slider.$imagesLazy[index].eq(pos - 1));
										}
										else if (pos > 1) {
											slider.lazyLoad(slider.$imagesLazy[index].eq(pos - 1));
										}
									}
									
									$slides
										.attr('aria-hidden', true)
										.eq(pos)
										.attr('aria-hidden', false);
									
									globalPos = pos;
									cookie.set(carouselID, globalPos);
								}
							};
						
						if (nav) {
							$navPrev.attr('id', 'nav_prev-' + index);
							$navNext.attr('id', 'nav_next-' + index);
							cycleOpts.prev = '#nav_prev-' + index;
							cycleOpts.next = '#nav_next-' + index;
						}
						
						if (pager) {
							$navPager.attr('id', 'nav_pager-' + index);
							cycleOpts.pager = '#nav_pager-' + index;
							cycleOpts.pagerAnchorBuilder = function(idx, slide) {
								return '<li><a href="#slide-' + (idx + 1) + '">Slide ' + (idx + 1) + '</a></li>';
							}
						}
						
						$feature
							.attr('style', widthOverride)
							.find('li')
							.attr('style', widthOverride);
						
						Modernizr.load({
							load: '/js/jquery.cycle.all.min.js',
							complete: function() {
								$feature
									.cycle(cycleOpts)
									.css('visibility', 'visible')
									.closest('.carousel')
									.addClass('jqcycle');
								
								$slides.css('visibility', 'visible');
								
								if (nav) {
									$navPrev.on('click', function(e) {
										e.preventDefault();
										$feature.cycle('pause');
									});
									
									$navNext.on('click', function(e) {
										e.preventDefault();
										$feature.cycle('pause');
									});
								}
								
								if (pager) {
									$navPager.css('z-index', slidesCount + 1).find('a').each(function(i) {
										$(this).on('click', function(e) {
											slider.lazyLoad(slider.$imagesLazy[index].eq(i));
											$feature.cycle('pause');
										});
									});
								}
							}
						});
					}
				}
			});
		}
	},
	
	lazyLoad: function(el, index, globalPos, slidesCount) {
		var $this = $(el),
			src = $this.data('src');
		
		if (src && !$this.data('loaded')) {
			var img = new Image();
			
			img.onload = function() {
				if ($this.data('bg-src') === false)
					$this[0].src = src;
				else
					$this[0].style.backgroundImage = 'url(' + src + ')';
				
				$this.data('loaded', true);
				
				if (slidesCount) {
					if (globalPos === 0) {
						slider.lazyLoad(slider.$imagesLazy[index].eq(globalPos + 1));
						slider.lazyLoad(slider.$imagesLazy[index].eq(slidesCount - 1));
					}
					else if (globalPos === slidesCount - 1) {
						slider.lazyLoad(slider.$imagesLazy[index].eq(0));
						slider.lazyLoad(slider.$imagesLazy[index].eq(globalPos - 1));
					}
					else {
						slider.lazyLoad(slider.$imagesLazy[index].eq(globalPos + 1));
						slider.lazyLoad(slider.$imagesLazy[index].eq(globalPos - 1));
					}
				}
				
				if ($swap.length === 1)
					$swap[0].src = src;
			};
			
			img.src = src;
		}
	}
};

var tabs = {
	init: function() {
		var $tabs = $('.tabs');
		
		$tabs.each(function(index) {
			var $this = $(this),
				$links = $this.find('> li a'),
				$panes = $this.nextAll('.panes:first').find('> .pane'),
				tabID = 'tabid-' + window.location.pathname + '-' + index,
				tabCookie = cookie.read(tabID);
			
			if (tabCookie) {
				$links.eq(tabCookie).addClass('current');
				$panes.hide().attr('aria-hidden', true);
				$panes.eq(tabCookie).show().attr('aria-hidden', false);
			}
			else {
				$links.eq(0).addClass('current');
				$panes.not(':first').attr('aria-hidden', true);
			}
			
			$links.on('click', function(e) {
				e.preventDefault();
				
				var $this = $(this),
					idx = $this.parent().index();
				
				if (!$this.hasClass('current')) {
					$links.removeClass('current');
					$this.addClass('current');
				}
				
				$panes.hide().attr('aria-hidden', true);
				$panes.eq(idx).show().attr('aria-hidden', false);
				
				cookie.set(tabID, idx);
				trackEvent('Website', 'Tabs', tabID + '-' + idx);
			});
		});
	}
};

var accordion = {
	init: function() {
		var $accordion = $('.accordion');
		if ($accordion.length) {
			$accordion.each(function(index) {
				var $this = $(this),
					$accordionLinks = $this.find('> ul > li > a'),
					$accordionContent = $this.find($('.accordion_content')),
					accordionID = 'accordionid-' + window.location.pathname + '-' + index,
					accordionCookie = cookie.read(accordionID);
				
				$accordionContent.attr('aria-hidden', true);
				
				$accordionLinks.each(function(idx) {
					var $this = $(this);
					
					if (accordionCookie) {
						if (parseInt(accordionCookie) === idx) {
							$accordionLinks.removeClass('open');
							$this.addClass('open');
							$accordionContent.eq(idx).attr('aria-hidden', false);
						}
					}
					else {
						if ($this.hasClass('open')) {
							$accordionContent.eq(idx).attr('aria-hidden', false);
							cookie.set(accordionID, idx);
						}
					}
					
					$this.on('click', function(e) {
						e.preventDefault();
						$accordionContent.attr('aria-hidden', true);
						$accordionLinks.removeClass('open');
						
						var $this = $(this);
						
						$this.addClass('open');
						$this.next().attr('aria-hidden', false);
												
						cookie.set(accordionID, idx);
						trackEvent('Website', 'Accordions', accordionID + '-' + idx);
					});
				});
			});
		}
	}
};

})(window, document);