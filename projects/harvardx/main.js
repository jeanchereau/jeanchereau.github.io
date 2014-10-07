/**
 * Created by Jean Chereau on 04/10/2014
 * http://www.jeanchereau.com/projects/harvardx/index.html
 */
;(function(window, $, undefined){

    // TODO: optimize packaging


    //Function n*(n-1)*(n-2)*... (k+2)*(k+1)*k
    //Recursion induces stack overflows
    function fact(n, k) {
        if (!k) {
            k = 1; //n!
        }
        if (k > n || n < 0 || k < 0) {
            throw new RangeError('We should have n >= k >= 0')
        }
        if(n == 0) {
            return 1
        } else {
            ret = 1;
            for(i = k; i <= n; i++) {
                ret *= i;
            }
            return ret;
        }
    }

    //Binomial coeff
    function coeff(n, k) {
        if (n === k) {
            return 1
        } else {
            return fact(n, k + 1) / fact(n - k, 1);
            //return fact(n)/(fact(k)*fact(n-k));
        }
    }

    //Probability mass function
    function pmf(k ,n, p) {
        return coeff(n, k)*Math.pow(p, k)*Math.pow(1-p, n-k);
    }

    //Probability density function
    function pdf(x ,m, v) {
        return Math.pow(Math.E, -Math.pow(x-m, 2)/(2*v))/Math.sqrt(2*Math.PI*v);
    }

    //event handler triggered when the window/page is resized
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

    var viewModel = window.viewModel = kendo.observable({
        //success probability
        sp: 0.3,
        $sp: function() {
            return kendo.toString(this.get('sp'), 'p');
        },
        //experiments
        e: 20,
        //failure probability
        $fp: function() {
            return kendo.toString(1 - this.get('sp'), 'p');
        },
        //mean - http://en.wikipedia.org/wiki/Binomial_distribution#Mean_and_variance
        mean: function() {
            return this.get('e')*this.get('sp');
        },
        //variance
        var: function() {
            var sp = this.get('sp');
            return this.get('e')*sp*(1-sp);
        },
        //chart types
        binType: 'column',
        gauType: 'line',
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
                charts = $('.panel-body').find(kendo.roleSelector('chart'));
            //reset chart types
            if (charts.length >= 2) {
                var chart1 = $(charts[0]).data("kendoChart"),
                    chart2 = $(charts[1]).data("kendoChart");
                if (binType !== 'hide') {
                    chart1.options.series[0].type = binType;
                    chart2.options.series[0].type = binType;
                }
                if (gauType !== 'hide') {
                    chart1.options.series[1].type = gauType;
                    chart2.options.series[1].type = gauType;
                }
            }
            //reset data
            this.set('dataSet1', []);
            this.set('dataSet2', []);
            this.set('progress', 0);
        },
        redraw: function() {
            function calculations(k, n, p) {
                setTimeout(function() { //setTimeout yields time to refresh the UI, otherwise the progress bar is not refreshed and jumps from 0 to 100%
                    var node1 = { sn: k }, node2 = { sn: k };
                        if (binType !== 'hide') {
                            node2.bin = node1.bin = pmf(k, n, p); //(sn, e, sp);
                        }
                        if (gauType !== 'hide') {
                            node2.gau = node1.gau = pdf(k, n * p, n * p * (1 - p));
                        }
                    dataSet1.push(node1);
                    if (k === 1) {
                        dataSet2.push(node2);
                    } else {
                        if (binType !== 'hide') {
                            node2.bin += dataSet2[k - 2].bin; //cumul
                        }
                        if (gauType !== 'hide') {
                            node2.gau += dataSet2[k - 2].gau; //cumul
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
                e = that.get('e'),
                sp = that.get('sp'),
                binType = that.get('binType'),
                gauType = that.get('gauType');

            //reset datasets and progress bar
            that.reset();

            //sn is the number of success events in e experiments
            for (sn = 1; sn <= e; sn++) {
                calculations(sn, e, sp);
            }
        }
    });

    //event handler triggered when the DOM is loaded
    $(document).ready(function() {
        //bind html body to viewModel
        kendo.bind('body', window.viewModel);
        //draw first experient
        window.viewModel.redraw();
        //window resize event
        $(window).on('resize', onResize);
    });


}(this, jQuery));