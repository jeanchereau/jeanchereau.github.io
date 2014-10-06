/**
 * Created by Jean Chereau on 04/10/2014
 * http://www.jeanchereau.com/projects/harvardx/index.html
 */
;(function(window, $, undefined){

    // TODO:
    // - add more explanations
    // - improve the algorithm for coeff(n,k) to avoid calculating k! twice
    // - add graph legends and axis descriptions - see http://demos.telerik.com/kendo-ui/line-charts/index - see also http://docs.telerik.com/kendo-ui/api/javascript/dataviz/ui/chart
    // - Comparisons with other similar distributions (e.g. Gaussian, Poisson, ...). See http://www.johndcook.com/distribution_chart.html
    // - To approximate binomial with normal see: http://en.wikipedia.org/wiki/Binomial_distribution#Mean_and_variance
    // - display several series (at least 2) to allow for comparisons
    // - try to remove the limit of 150 draws using an array of precalculated factorials and a big number javascript library
    // - handle window resize event
    // - optimize packaging

    //Function n!
    //Recursion induces stack overflows
    function fact(n) {
        if(n == 0) {
            return 1
        } else {
            ret = 1;
            for(i = 1; i <= n; i++) {
                ret *= i;
            }
            return ret;
        }
    }

    //Binomial coeff
    function coeff(n, k) {
        return fact(n)/(fact(k)*fact(n-k));
    }

    //Probability mass function
    //sn is the number of success draws
    function pmf(k ,n, p) {
        return coeff(n, k)*Math.pow(p, k)*Math.pow(1-p, n-k);
    }

    var viewModel = window.viewModel = kendo.observable({
        //success probability
        sp: 0.3,
        //draws
        d: 20,
        //failure probability
        fp: function() {
            return kendo.toString(1 - this.get('sp'), 'p');
        },
        //Data for probability mass function
        pmf: [],
        //Data for cumulative distribution function
        cdf: [],
        //Progress displayed in progress bar
        progress: 0,
        //change event handler to reset UI
        reset: function() {
            this.set('pmf', []);
            this.set('cdf', []);
            this.set('progress', 0);
        }
    });

    //event handler triggered when the DOM is loaded
    $(document).ready(function() {

        //bind html body to viewModel
        kendo.bind('body', window.viewModel);

        //event handler triggered when clicking the run button
        $('#run').on('click', function(e) {

            function calculations(k, n, p) {
                setTimeout(function() { //setTimeout yields time to refresh the UI, otherwise the progress bar is not refreshed and jumps from 0 to 100%
                    var pm = pmf(k, n, p); //(sn, d, sp);
                    window.viewModel.pmf.push({sn: k, pmf: pm});
                    if (k === 1) {
                        window.viewModel.cdf.push({sn: k, cdf: pm});
                    } else {
                        var cd = pm + window.viewModel.get('cdf[' + (k-2).toString() +'].cdf'); //cumul
                        window.viewModel.cdf.push({sn: k, cdf: cd });
                    }
                    window.viewModel.set('progress', 100*k/n);
                }, 0);
            }

            var d = window.viewModel.get('d'),
                sp = window.viewModel.get('sp');
            window.viewModel.reset();
            //sn is the number of success events in d draws
            for (sn = 1; sn <= d; sn++) {
                    calculations(sn, d, sp);
            }
        });

        //event handler triggered when the window/page is resized
        window.on('resize', function() {
            //TODO - http://docs.telerik.com/kendo-ui/using-kendo-in-responsive-web-pages
        });
    });


}(this, jQuery));