const Doz = require('../index');
const be = require('bejs');

describe('Doz.css.class', function () {

    this.timeout(5000);

    before(function () {
        this.jsdom = require('jsdom-global')()
    });

    after(function () {
        this.jsdom()
    });

    beforeEach(function () {
        document.body.innerHTML = '';
        Doz.collection.removeAll();
    });

    describe('create view', function () {

        it('should be ok', function (done) {

            document.body.innerHTML = `<div id="app"></div>`;

            Doz.component('salutation-card', {
                template() {
                    return `<div>Hello ${this.props.title} ${this.props.name} <caller-o d:class="my-class"></caller-o></div>`
                }
            });

            Doz.component('caller-o', {
                template() {
                    return `<div>Callback</div>`
                },
                onCreate() {
                    setTimeout(()=>{
                        this.emit('mycallback', 'hello');
                    },1000);
                }
            });

            new Doz({
                root: '#app',
                template: `
                    <salutation-card
                        title="MR."
                        name="Doz">
                    </salutation-card>
                `
            });

            setTimeout(()=>{
                const html = document.body.innerHTML;
                console.log(html);
                /*console.log(view);
                be.err.true(/Doz/g.test(html));
                be.err(done).true(/Luis/g.test(html));*/
                done()
            },100);
        });
    });
});