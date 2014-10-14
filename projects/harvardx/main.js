/**
 * Created by Jean Chereau on 04/10/2014
 * http://www.jeanchereau.com/projects/harvardx/index.html
 */

/* jshint browser:true, jquery: true */

;(function(window, $, undefined){

    // TODO: optimize packaging
    // Possibly use an array of precalculated binomial coeffs with a javascript bignumber library to increase number of experiments

    var kendo = window.kendo;

    /**
     * Function n*(n-1)*(n-2)*... (k+2)*(k+1)*k
     * Avoids recursion which induces stack overflows
     * @param n
     * @param k
     * @returns {number}
     */
    function fact(n, k) {
        if (!k) {
            k = 1; //n!
        }
        if (k > n || n < 0 || k < 0) {
            throw new RangeError('We should have n >= k >= 0');
        }
        if(n === 0) {
            return 1;
        } else {
            var ret = 1;
            for(var i = k; i <= n; i++) {
                ret *= i;
            }
            return ret;
        }
    }

    /**
     * Binomial coefficient
     * @param n
     * @param k
     * @returns {number}
     */
    function coeff(n, k) {
        if (n === k) {
            return 1;
        } else {
            return fact(n, k + 1) / fact(n - k, 1);
            //return fact(n)/(fact(k)*fact(n-k));
        }
    }

    /**
     * Probability mass function
     * @param k
     * @param n
     * @param p
     * @returns {number}
     */
    function pmf(k ,n, p) {
        return coeff(n, k)*Math.pow(p, k)*Math.pow(1-p, n-k);
    }

    /**
     * Probability density function
     * @param x
     * @param m
     * @param v
     * @returns {number}
     */
    function pdf(x ,m, v) {
        return Math.pow(Math.E, -Math.pow(x-m, 2)/(2*v))/Math.sqrt(2*Math.PI*v);
    }

    /**
     * Event handler triggered when the window/page is resized
     */
    function onResize() {
        var charts = $('.panel-body').find(kendo.roleSelector('chart'));
        $.each(charts, function(index, chart) {
            $(chart).data("kendoChart").refresh();
        });
        var sliders = $('.panel-body').find(kendo.roleSelector('slider'));
        $.each(sliders, function(index, slider) {
            $(slider).data("kendoSlider").resize();
        });
    }

    function config() {
        //See http://docs.mathjax.org/en/latest/start.html
        //See also http://meta.math.stackexchange.com/questions/5020/mathjax-basic-tutorial-and-quick-reference
        window.MathJax.Hub.Config({
            extensions: ["TeX/AMSmath.js"],
            jax: ["input/TeX", "output/HTML-CSS"],
            preRemoveClass: "MathJax_Preview",
            showProcessingMessages: true,
            tex2jax: {
                inlineMath: [ ["\\(","\\)"] ],
                displayMath: [ ["\\[","\\]"] ],
                skipTags: ["script","noscript","style","textarea","pre","code"],
                processEscapes: false,
                processEnvironments: true
            },
            "HTML-CSS": {
                availableFonts: ["STIX", "TeX"],
                preferredFont: "TeX",
                imageFont: "TeX",
                showMathMenu: true
            },
            MathMenu: {
                showFontMenu: true
            }
        });
    }

    /**
     * viewModel (MVVM)
     */
    window.viewModel = kendo.observable({
        //success probability
        sp: 0.3,
        $sp: function() {
            return kendo.toString(this.get('sp'), 'p');
        },
        //number of experiments
        nex: 20,
        //failure probability
        $fp: function() {
            return kendo.toString(1 - this.get('sp'), 'p');
        },
        //mean - http://en.wikipedia.org/wiki/Binomial_distribution#Mean_and_variance
        mean: function() {
            return kendo.toString(this.get('nex')*this.get('sp'), 'n3');
        },
        //variance
        variance: function() {
            var sp = this.get('sp');
            return kendo.toString(this.get('nex')*sp*(1-sp), 'n3');
        },
        //number of times to run the experiment
        t: 1000,
        //chart types
        binType: 'column',
        gauType: 'line',
        expType: 'column',
        //Data for chart1 (probability mass function)
        dataSet1: [],
        //Data for chart2 (cumulative distribution function)
        dataSet2: [],
        //Progress displayed in progress bar
        progress: 0,
        //change event handler to reset UI
        reset: function() {
            var binType = this.get('binType'),
                gauType = this.get('gauType'),
                expType = this.get('expType'),
                charts = $('.panel-body').find(kendo.roleSelector('chart'));
            //reset chart types
            if (charts.length >= 2) {
                var chart1 = $(charts[0]).data("kendoChart"),
                    chart2 = $(charts[1]).data("kendoChart");
                if (expType !== 'hide') {
                    chart1.options.series[0].type = expType;
                    chart2.options.series[0].type = expType;
                }
                if (binType !== 'hide') {
                    chart1.options.series[1].type = binType;
                    chart2.options.series[1].type = binType;
                }
                if (gauType !== 'hide') {
                    chart1.options.series[2].type = gauType;
                    chart2.options.series[2].type = gauType;
                }
            }
            //reset data
            this.set('dataSet1', []);
            this.set('dataSet2', []);
            this.set('progress', 0);
        },
        redraw: function() {
            function experimentation(t, n, p) {
                var results = new Array(n + 1);
                if (expType !== 'hide') {
                    for (var i = 0; i <= n; i++) {
                        results[i] = 0;
                    }
                    for (/*var*/ i = 0; i < t; i++) {
                        var x = 0; //count of success events
                        for (var j = 0; j < n; j++) {
                            if (Math.random() < p) { //our success event (we assume there is no difference between < and <=)
                                x++;
                            }
                        }
                        results[x] += 1 / t;
                    }
                }
                return results;
            }
            function calculations(k, n, p) {
                setTimeout(function() { //setTimeout yields time to refresh the UI, otherwise the progress bar is not refreshed and jumps from 0 to 100%
                    var node1 = { sn: k }, node2 = { sn: k };
                        if (binType !== 'hide') {
                            node2.bin = node1.bin = pmf(k, n, p); //(sn, nex, sp);
                        }
                        if (gauType !== 'hide') {
                            node2.gau = node1.gau = pdf(k, n * p, n * p * (1 - p));
                        }
                        if (expType !== 'hide') {
                            node2.exp = node1.exp = exp[k];
                        }
                    dataSet1.push(node1);
                    if (k === 0) {
                        dataSet2.push(node2);
                    } else {
                        if (binType !== 'hide') {
                            node2.bin += dataSet2[k - 1].bin; //cumul
                        }
                        if (gauType !== 'hide') {
                            node2.gau += dataSet2[k - 1].gau; //cumul
                        }
                        if (gauType !== 'hide') {
                            node2.exp += dataSet2[k - 1].exp; //cumul
                        }
                        dataSet2.push(node2);
                    }
                    that.set('progress', 100*k/n);
                    if (k === n) {
                        that.set('dataSet1', dataSet1);
                        that.set('dataSet2', dataSet2);
                    }
                }, 0);
            }

            var that = this,
                dataSet1 = [], dataSet2 = [],
                nex = that.get('nex'),
                sp = that.get('sp'),
                t = that.get('t'),
                binType = that.get('binType'),
                gauType = that.get('gauType'),
                expType = that.get('expType'),
                exp = experimentation(t, nex, sp);

            //reset datasets and progress bar
            that.reset();

            //sn is the number of success events in nex experiments
            for (var sn = 0; sn <= nex; sn++) {
                calculations(sn, nex, sp);
            }
        }
    });

    /**
     * Event handler triggered when the DOM is loaded
     */
    $(document).ready(function() {
        //Config MathJax
        config();
        //bind html body to viewModel
        kendo.bind('body', window.viewModel);
        //prepare tooltips
        $('.panel-heading a').popover({
            //http://getbootstrap.com/javascript/#popovers-usage
            content: function() {
                return $(this).find('div.hide').html();
            },
            html: true,
            placement: 'bottom',
            //title - see data-title in html
            trigger: 'click focus'
        });
        //draw charts
        window.viewModel.redraw();
        //window resize event
        $(window).on('resize', onResize);
    });


}(this, jQuery));