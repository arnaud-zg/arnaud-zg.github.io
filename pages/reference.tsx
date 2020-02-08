import classNames from 'classnames';
import { NextSeo } from 'next-seo';
import React, { useEffect } from 'react';
import { Background } from '../features/common';
import {
  descriptions,
  firstName,
  lastName,
  url,
} from '../features/common/data.json';
import { Layout } from '../features/common/Layout';

function HomePage() {
  useEffect(() => {
    window.onload = () => {
      document.body.classList.remove('is-preload');
    };
    window.ontouchmove = () => false;
    window.onorientationchange = () => {
      document.body.scrollTop = 0;
    };
  });

  return (
    <Layout>
      <NextSeo
        title={`${firstName} ${lastName} | ${descriptions[0]}`}
        description={`${descriptions[0]}`}
        openGraph={{
          title: `${firstName} ${lastName} | ${descriptions[0]}`,
          description: `${descriptions[0]}`,
          url,
          type: 'profile',
          profile: {
            firstName,
            lastName,
            gender: 'male',
          },
        }}
      />
      <Background />
      <div
        className={classNames(
          'fixed',
          'flex',
          'h-full',
          'inset-0',
          'justify-center',
          'text-black',
          'w-full'
        )}>
        <div
          className={classNames(
            'bg-gray-200',
            'h-auto',
            'inline-block',
            'mb-24',
            'md:mb-48',
            'mt-6',
            'overflow-y-scroll',
            'p-4',
            'w-4/5'
          )}>
          <div>
            <h2 className="major">Elements</h2>
            <p>
              Sed vel nibh libero. Mauris et lorem pharetra massa lorem turpis
              congue pulvinar. Vivamus sed feugiat finibus. Duis amet bibendum
              amet sed. Duis mauris ex, dapibus sed ligula tempus volutpat magna
              etiam.
            </p>
          </div>
          <div>
            <h3 className="major">Text</h3>
            <p>
              This is <b>bold</b> and this is <strong>strong</strong>. This is{' '}
              <i>italic</i> and this is <em>emphasized</em>. This is{' '}
              <sup>superscript</sup> text and this is <sub>subscript</sub> text.
              This is <u>underlined</u> and this is code:{' '}
              <code>{`for (;;) { ... }`}</code>. Finally,{' '}
              <a href="#">this is a link</a>.
            </p>

            <h1>Heading Level 1</h1>
            <h2>Heading Level 2</h2>
            <h3>Heading Level 3</h3>
            <h4>Heading Level 4</h4>
            <h5>Heading Level 5</h5>
            <h6>Heading Level 6</h6>
          </div>
          <div>
            <header>
              <h2>Heading with a Subtitle</h2>
              <p>Lorem ipsum dolor sit amet nullam id egestas urna aliquam</p>
            </header>
            <p>
              Nunc lacinia ante nunc ac lobortis. Interdum adipiscing gravida
              odio porttitor sem non mi integer non faucibus ornare mi ut ante
              amet placerat aliquet. Volutpat eu sed ante lacinia sapien lorem
              accumsan varius montes viverra nibh in adipiscing blandit tempus
              accumsan.
            </p>

            <header>
              <h3>Heading with a Subtitle</h3>
              <p>Lorem ipsum dolor sit amet nullam id egestas urna aliquam</p>
            </header>
            <p>
              Nunc lacinia ante nunc ac lobortis. Interdum adipiscing gravida
              odio porttitor sem non mi integer non faucibus ornare mi ut ante
              amet placerat aliquet. Volutpat eu sed ante lacinia sapien lorem
              accumsan varius montes viverra nibh in adipiscing blandit tempus
              accumsan.
            </p>
            <header>
              <h4>Heading with a Subtitle</h4>
              <p>Lorem ipsum dolor sit amet nullam id egestas urna aliquam</p>
            </header>
            <p>
              Nunc lacinia ante nunc ac lobortis. Interdum adipiscing gravida
              odio porttitor sem non mi integer non faucibus ornare mi ut ante
              amet placerat aliquet. Volutpat eu sed ante lacinia sapien lorem
              accumsan varius montes viverra nibh in adipiscing blandit tempus
              accumsan.
            </p>
          </div>
          <div>
            <h2>Lists</h2>
            <div className="row">
              <div className="col-6 col-12-small">
                <h3>Unordered</h3>
                <ul>
                  <li>Dolor pulvinar etiam.</li>
                  <li>Sagittis lorem eleifend.</li>
                  <li>Felis feugiat dolore viverra.</li>
                  <li>Dolor pulvinar etiam.</li>
                </ul>

                <h3>Alternate</h3>
                <ul className="alt">
                  <li>Dolor pulvinar etiam etiam.</li>
                  <li>Sagittis adipiscing eleifend.</li>
                  <li>Felis enim dolore viverra.</li>
                  <li>Dolor pulvinar etiam etiam.</li>
                </ul>
              </div>
              <div className="col-6 col-12-small">
                <h3>Ordered</h3>
                <ol>
                  <li>Dolor pulvinar etiam.</li>
                  <li>Etiam vel felis at viverra.</li>
                  <li>Felis enim feugiat magna.</li>
                  <li>Etiam vel felis nullam.</li>
                  <li>Felis enim et tempus.</li>
                </ol>
              </div>
            </div>

            <h3>Definition</h3>
            <dl>
              <dt>Item 1</dt>
              <dd>
                <p>
                  Lorem ipsum dolor vestibulum ante ipsum primis in faucibus
                  vestibulum. Blandit adipiscing eu felis iaculis volutpat ac
                  adipiscing accumsan eu faucibus. Integer ac pellentesque
                  praesent.
                </p>
              </dd>
              <dt>Item 2</dt>
              <dd>
                <p>
                  Lorem ipsum dolor vestibulum ante ipsum primis in faucibus
                  vestibulum. Blandit adipiscing eu felis iaculis volutpat ac
                  adipiscing accumsan eu faucibus. Integer ac pellentesque
                  praesent.
                </p>
              </dd>
              <dt>Item 3</dt>
              <dd>
                <p>
                  Lorem ipsum dolor vestibulum ante ipsum primis in faucibus
                  vestibulum. Blandit adipiscing eu felis iaculis volutpat ac
                  adipiscing accumsan eu faucibus. Integer ac pellentesque
                  praesent.
                </p>
              </dd>
            </dl>
          </div>
          <div>
            <h3>Actions</h3>
            <ul className="actions">
              <li>
                <a href="#" className="button primary">
                  Primary
                </a>
              </li>
              <li>
                <a href="#" className="button">
                  Default
                </a>
              </li>
            </ul>
            <ul className="actions small">
              <li>
                <a href="#" className="button primary small">
                  Small
                </a>
              </li>
              <li>
                <a href="#" className="button small">
                  Small
                </a>
              </li>
            </ul>
            <div className="row">
              <div className="col-6 col-12-small">
                <ul className="actions stacked">
                  <li>
                    <a href="#" className="button primary">
                      Default
                    </a>
                  </li>
                  <li>
                    <a href="#" className="button">
                      Default
                    </a>
                  </li>
                </ul>
              </div>
              <div className="col-6 col-12-small">
                <ul className="actions stacked">
                  <li>
                    <a href="#" className="button primary small">
                      Small
                    </a>
                  </li>
                  <li>
                    <a href="#" className="button small">
                      Small
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="row">
              <div className="col-6 col-12-small">
                <ul className="actions stacked">
                  <li>
                    <a href="#" className="button primary fit">
                      Default
                    </a>
                  </li>
                  <li>
                    <a href="#" className="button fit">
                      Default
                    </a>
                  </li>
                </ul>
              </div>
              <div className="col-6 col-12-small">
                <ul className="actions stacked">
                  <li>
                    <a href="#" className="button primary small fit">
                      Small
                    </a>
                  </li>
                  <li>
                    <a href="#" className="button small fit">
                      Small
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div>
            <h4>Blockquote</h4>
            <blockquote>
              Lorem ipsum dolor sit amet. Felis sagittis eget tempus euismod.
              Vestibulum ante ipsum primis in vestibulum. Blandit adipiscing eu
              iaculis volutpat ac adipiscing volutpat ac adipiscing faucibus.
            </blockquote>

            <h4>Preformatted</h4>
            <pre>
              <code>
                {`
i = 0;

while (!deck.isInOrder()) {
    print 'Iteration ' + (i++);
    deck.shuffle();
}

print 'It took ' + i + ' iterations to sort the deck.';
`}
              </code>
            </pre>
          </div>
          <div>
            <h3 className="major">Lists</h3>

            <h4>Unordered</h4>
            <ul>
              <li>Lorem ipsum dolor sit.</li>
              <li>Dolor pulvinar etiam.</li>
              <li>Etiam vel felis viverra.</li>
            </ul>

            <h4>Alternate</h4>
            <ul className="alt">
              <li>Lorem ipsum dolor sit.</li>
              <li>Dolor pulvinar etiam.</li>
              <li>Etiam vel felis viverra.</li>
              <li>Felis enim feugiat.</li>
            </ul>
          </div>

          <div>
            <h4>Ordered</h4>
            <ol>
              <li>Lorem ipsum dolor sit.</li>
              <li>Dolor pulvinar etiam.</li>
              <li>Etiam vel felis viverra.</li>
              <li>Felis enim feugiat.</li>
              <li>Etiam vel felis lorem.</li>
            </ol>

            <h4>Actions</h4>
            <ul className="actions">
              <li>
                <a href="#" className="button special color2">
                  Default
                </a>
              </li>
              <li>
                <a href="#" className="button">
                  Default
                </a>
              </li>
            </ul>
            <ul className="actions vertical">
              <li>
                <a href="#" className="button special color2">
                  Default
                </a>
              </li>
              <li>
                <a href="#" className="button">
                  Default
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4>Icons</h4>
            <ul className="icons">
              <li>
                <a href="#" className="icon fa-twitter">
                  <span className="label">Twitter</span>
                </a>
              </li>
              <li>
                <a href="#" className="icon fa-facebook">
                  <span className="label">Facebook</span>
                </a>
              </li>
              <li>
                <a href="#" className="icon fa-instagram">
                  <span className="label">Instagram</span>
                </a>
              </li>
              <li>
                <a href="#" className="icon fa-github">
                  <span className="label">GitHub</span>
                </a>
              </li>
              <li>
                <a href="#" className="icon fa-medium">
                  <span className="label">Medium</span>
                </a>
              </li>
            </ul>

            <h4>Contact Icons</h4>
            <ul className="contact-icons color2">
              <li className="icon fa-twitter">
                <a href="#">Twitter</a>
              </li>
              <li className="icon fa-facebook">
                <a href="#">Facebook</a>
              </li>
              <li className="icon fa-instagram">
                <a href="#">Instagram</a>
              </li>
              <li className="icon fa-github">
                <a href="#">GitHub</a>
              </li>
              <li className="icon fa-medium">
                <a href="#">Medium</a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="major">Table</h3>
            <h4>Default</h4>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Item One</td>
                    <td>Ante turpis integer aliquet porttitor.</td>
                    <td>29.99</td>
                  </tr>
                  <tr>
                    <td>Item Two</td>
                    <td>Vis ac commodo adipiscing arcu aliquet.</td>
                    <td>19.99</td>
                  </tr>
                  <tr>
                    <td>Item Three</td>
                    <td> Morbi faucibus arcu accumsan lorem.</td>
                    <td>29.99</td>
                  </tr>
                  <tr>
                    <td>Item Four</td>
                    <td>Vitae integer tempus condimentum.</td>
                    <td>19.99</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2}></td>
                    <td>100.00</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          <div>
            <h4>Alternate</h4>
            <div className="table-wrapper">
              <table className="alt">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Item One</td>
                    <td>Ante turpis integer aliquet porttitor.</td>
                    <td>29.99</td>
                  </tr>
                  <tr>
                    <td>Item Two</td>
                    <td>Vis ac commodo adipiscing arcu aliquet.</td>
                    <td>19.99</td>
                  </tr>
                  <tr>
                    <td>Item Three</td>
                    <td> Morbi faucibus arcu accumsan lorem.</td>
                    <td>29.99</td>
                  </tr>
                  <tr>
                    <td>Item Four</td>
                    <td>Vitae integer tempus condimentum.</td>
                    <td>19.99</td>
                  </tr>
                  <tr>
                    <td>Item Five</td>
                    <td>Ante turpis integer aliquet porttitor.</td>
                    <td>29.99</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2}></td>
                    <td>100.00</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          <div>
            <h3 className="major">Buttons</h3>
            <ul className="actions">
              <li>
                <a href="#" className="button special color2">
                  Special
                </a>
              </li>
              <li>
                <a href="#" className="button">
                  Default
                </a>
              </li>
            </ul>
            <ul className="actions">
              <li>
                <a href="#" className="button">
                  Default
                </a>
              </li>
              <li>
                <a href="#" className="button large">
                  Large
                </a>
              </li>
              <li>
                <a href="#" className="button small">
                  Small
                </a>
              </li>
            </ul>
            <ul className="actions">
              <li>
                <a href="#" className="button special color2 icon fa-cog">
                  Icon
                </a>
              </li>
              <li>
                <a href="#" className="button icon fa-diamond">
                  Icon
                </a>
              </li>
            </ul>
            <ul className="actions">
              <li>
                <span className="button special color2 disabled">Disabled</span>
              </li>
              <li>
                <span className="button disabled">Disabled</span>
              </li>
            </ul>
            <ul className="actions">
              <li>
                <a
                  href="#"
                  className="button special color2 circle icon fa-cog">
                  Icon
                </a>
              </li>
              <li>
                <a href="#" className="button circle icon fa-diamond">
                  Icon
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="major">Form</h3>
            <form method="post" action="#">
              <div className="field third">
                <label htmlFor="demo-name">Name</label>
                <input
                  type="text"
                  name="demo-name"
                  id="demo-name"
                  value=""
                  placeholder="Jane Doe"
                />
              </div>
              <div className="field third">
                <label htmlFor="demo-email">Email</label>
                <input
                  type="email"
                  name="demo-email"
                  id="demo-email"
                  value=""
                  placeholder="jane@untitled.tld"
                />
              </div>
              <div className="field third">
                <label htmlFor="demo-category">Category</label>
                <div className="select-wrapper">
                  <select name="demo-category" id="demo-category">
                    <option value="">-</option>
                    <option value="1">Manufacturing</option>
                    <option value="1">Shipping</option>
                    <option value="1">Administration</option>
                    <option value="1">Human Resources</option>
                  </select>
                </div>
              </div>
              <div className="field quarter">
                <input
                  type="radio"
                  id="demo-priority-low"
                  name="demo-priority"
                  className="color2"
                  checked
                />
                <label htmlFor="demo-priority-low">Low Priority</label>
              </div>
              <div className="field quarter">
                <input
                  type="radio"
                  id="demo-priority-high"
                  name="demo-priority"
                  className="color2"
                />
                <label htmlFor="demo-priority-high">High Priority</label>
              </div>
              <div className="field quarter">
                <input
                  type="checkbox"
                  id="demo-copy"
                  name="demo-copy"
                  className="color2"
                />
                <label htmlFor="demo-copy">Email a copy</label>
              </div>
              <div className="field quarter">
                <input
                  type="checkbox"
                  id="demo-human"
                  name="demo-human"
                  className="color2"
                  checked
                />
                <label htmlFor="demo-human">Not a robot</label>
              </div>
              <div className="field">
                <label htmlFor="demo-message">Message</label>
                <textarea
                  name="demo-message"
                  id="demo-message"
                  placeholder="Enter your message"
                  rows={2}></textarea>
              </div>
              <ul className="actions">
                <li>
                  <input
                    type="submit"
                    value="Send Message"
                    className="special color2"
                  />
                </li>
                <li>
                  <input type="reset" value="Reset" />
                </li>
              </ul>
            </form>
          </div>
          <div>
            <h2>Image</h2>
            <h3>Fit</h3>
            <span className="image fit">
              <img src="images/pic01.jpg" alt="" />
            </span>
            <div className="box alt">
              <div className="row gtr-50 gtr-uniform">
                <div className="col-4">
                  <span className="image fit">
                    <img src="images/pic02.jpg" alt="" />
                  </span>
                </div>
                <div className="col-4">
                  <span className="image fit">
                    <img src="images/pic03.jpg" alt="" />
                  </span>
                </div>
                <div className="col-4">
                  <span className="image fit">
                    <img src="images/pic04.jpg" alt="" />
                  </span>
                </div>
                <div className="col-4">
                  <span className="image fit">
                    <img src="images/pic04.jpg" alt="" />
                  </span>
                </div>
                <div className="col-4">
                  <span className="image fit">
                    <img src="images/pic02.jpg" alt="" />
                  </span>
                </div>
                <div className="col-4">
                  <span className="image fit">
                    <img src="images/pic03.jpg" alt="" />
                  </span>
                </div>
                <div className="col-4">
                  <span className="image fit">
                    <img src="images/pic03.jpg" alt="" />
                  </span>
                </div>
                <div className="col-4">
                  <span className="image fit">
                    <img src="images/pic04.jpg" alt="" />
                  </span>
                </div>
                <div className="col-4">
                  <span className="image fit">
                    <img src="images/pic02.jpg" alt="" />
                  </span>
                </div>
              </div>
            </div>
            <h3>Left &amp; Right</h3>
            <p>
              <span className="image left">
                <img src="images/pic08.jpg" alt="" />
              </span>
              Lorem ipsum dolor sit accumsan interdum nisi, quis tincidunt felis
              sagittis eget. tempus euismod. Vestibulum ante ipsum primis in
              faucibus vestibulum. Blandit adipiscing eu felis iaculis volutpat
              ac adipiscing accumsan eu faucibus. Integer ac pellentesque
              praesent tincidunt felis sagittis eget. tempus euismod. Vestibulum
              ante ipsum primis sagittis eget. tempus euismod. Vestibulum ante
              ipsum primis in faucibus vestibulum. Blandit adipiscing eu felis
              iaculis volutpat ac adipiscing accumsan eu faucibus. Integer ac
              pellentesque praesent tincidunt felis sagittis eget. tempus
              euismod. Vestibulum ante ipsum primis in faucibus vestibulum.
              Blandit adipiscing eu felis iaculis volutpat ac adipiscing
              accumsan eu faucibus. Integer ac pellentesque praesent. Vestibulum
              ante ipsum primis in faucibus magna blandit adipiscing eu felis
              iaculis.
            </p>
            <p>
              <span className="image right">
                <img src="images/pic09.jpg" alt="" />
              </span>
              Lorem ipsum dolor sit accumsan interdum nisi, quis tincidunt felis
              sagittis eget. tempus euismod. Vestibulum ante ipsum primis in
              faucibus vestibulum. Blandit adipiscing eu felis iaculis volutpat
              ac adipiscing accumsan eu faucibus. Integer ac pellentesque
              praesent tincidunt felis sagittis eget. tempus euismod. Vestibulum
              ante ipsum primis sagittis eget. tempus euismod. Vestibulum ante
              ipsum primis in faucibus vestibulum. Blandit adipiscing eu felis
              iaculis volutpat ac adipiscing accumsan eu faucibus. Integer ac
              pellentesque praesent tincidunt felis sagittis eget. tempus
              euismod. Vestibulum ante ipsum primis in faucibus vestibulum.
              Blandit adipiscing eu felis iaculis volutpat ac adipiscing
              accumsan eu faucibus. Integer ac pellentesque praesent. Vestibulum
              ante ipsum primis in faucibus magna blandit adipiscing eu felis
              iaculis.
            </p>
          </div>
          <div>
            <h2>Box</h2>
            <div className="box">
              <p>
                Felis sagittis eget tempus primis in faucibus vestibulum.
                Blandit adipiscing eu felis iaculis volutpat ac adipiscing
                accumsan eu faucibus. Integer ac pellentesque praesent tincidunt
                felis sagittis eget. tempus euismod. Magna sed etiam ante ipsum
                primis in faucibus vestibulum. Blandit adipiscing eu ipsum
                primis in faucibus vestibulum. Blandit adipiscing eu felis
                iaculis volutpat ac adipiscing accumsan eu faucibus lorem ipsum
                dolor sit amet nullam. Integer ac pellentesque praesent
                tincidunt felis sagittis eget. tempus euismod. Vestibulum ante
                ipsum primis sagittis eget. tempus euismod. Vestibulum ante
                ipsum primis in faucibus vestibulum. Blandit adipiscing eu felis
                iaculis volutpat ac adipiscing accumsan eu faucibus. Integer ac
                pellentesque praesent tincidunt felis sagittis eget. tempus
                euismod. Vestibulum ante ipsum primis in faucibus vestibulum.
                Blandit adipiscing eu felis iaculis volutpat ac adipiscing
                accumsan eu faucibus. Integer ac pellentesque praesent.
                Vestibulum ante ipsum primis in faucibus magna blandit
                adipiscing eu felis iaculis volutpat lorem ipsum dolor.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default HomePage;
