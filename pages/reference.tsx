import classNames from 'classnames';
import { NextSeo } from 'next-seo';
import React, { useEffect } from 'react';
import { Background } from '../features/common';
import { Block, DirectionEnum } from '../features/common/Block';
import {
  descriptions,
  firstName,
  lastName,
  url,
} from '../features/common/data.json';
import { Heading } from '../features/common/Heading';
import { Layout } from '../features/common/Layout';
import { Link } from '../features/common/Link';
import { Text, TextEnum } from '../features/common/Text';
import { Title, TitleProps } from '../features/common/Title';
import { List } from '../features/common/List';
import { Definition } from '../features/common/Definition';
import { Blockquote } from '../features/common/Blockquote';
import { Code } from '../features/common/Code';
import { Table } from '../features/common/Table';

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
          <Title level={4}>Elements</Title>
          <Block>
            <Title level={5}>Basic text</Title>
            <Text>
              Sed vel nibh libero. Mauris et lorem pharetra massa lorem turpis
              congue pulvinar. Vivamus sed feugiat finibus. Duis amet bibendum
              amet sed. Duis mauris ex, dapibus sed ligula tempus volutpat magna
              etiam.
            </Text>
          </Block>
          <Block>
            <Title level={5}>Advanced text</Title>
            <Text>
              This is <Text mode={TextEnum.BOLD}>bold</Text> and this is{' '}
              <Text mode={TextEnum.STRONG}>strong</Text>. This is{' '}
              <Text mode={TextEnum.ITALIC}>italic</Text> and this is{' '}
              <Text mode={TextEnum.EMPHASIS}>emphasized</Text>. This is{' '}
              <Text mode={TextEnum.SUPERSCRIPT}>superscript</Text> text and this
              is <Text mode={TextEnum.SUBSCRIPT}>subscript</Text> text. This is{' '}
              <Text mode={TextEnum.UNDERLINE}>underlined</Text> and this is
              code: <Text mode={TextEnum.CODE}>{`for (;;) { ... }`}</Text>.
              Finally, <Link href="#">this is a link</Link>.
            </Text>
          </Block>
          <Block>
            <Title level={5}>Heading</Title>
            <Title level={1}>Heading Level 1</Title>
            <Title level={2}>Heading Level 2</Title>
            <Title level={3}>Heading Level 3</Title>
            <Title level={4}>Heading Level 4</Title>
            <Title level={5}>Heading Level 5</Title>
            <Title level={6}>Heading Level 6</Title>
          </Block>
          <Block>
            {[1, 2, 3, 4, 5, 6].map((titleLevel: TitleProps['level']) => (
              <Block key={titleLevel}>
                <Heading
                  titleLevel={titleLevel}
                  title="Heading with a subtitle"
                  subTitle="Lorem ipsum dolor sit amet nullam id egestas urna aliquam"
                />
                <Text>
                  Nunc lacinia ante nunc ac lobortis. Interdum adipiscing
                  gravida odio porttitor sem non mi integer non faucibus ornare
                  mi ut ante amet placerat aliquet. Volutpat eu sed ante lacinia
                  sapien lorem accumsan varius montes viverra nibh in adipiscing
                  blandit tempus accumsan.
                </Text>
              </Block>
            ))}
          </Block>
          <Block>
            <Title level={5}>Lists</Title>
            <Block>
              <Title level={6}>Unordered</Title>
              <List
                items={[
                  { id: '1', content: 'Dolor pulvinar etiam.' },
                  { id: '2', content: 'Sagittis lorem eleifend.' },
                  { id: '3', content: 'Felis feugiat dolore viverra.' },
                  { id: '4', content: 'Felis enim feugiat.' },
                ]}
              />
            </Block>
            <Block>
              <Title level={6}>Alternate</Title>
              <List
                items={[
                  { id: '1', content: 'Dolor pulvinar etiam.' },
                  { id: '2', content: 'Sagittis lorem eleifend.' },
                  { id: '3', content: 'Felis feugiat dolore viverra.' },
                  { id: '4', content: 'Felis enim feugiat.' },
                ]}
              />
            </Block>
            <Block>
              <Title level={6}>Ordered</Title>
              <List
                items={[
                  { id: '1', content: 'Dolor pulvinar etiam.' },
                  { id: '2', content: 'Sagittis lorem eleifend.' },
                  { id: '3', content: 'Felis feugiat dolore viverra.' },
                  { id: '4', content: 'Felis enim feugiat.' },
                ]}
              />
            </Block>
            <Block>
              <Title level={6}>Definition</Title>
              <Definition
                items={[
                  {
                    name: 'Item 1',
                    description:
                      'Lorem ipsum dolor vestibulum ante ipsum primis in faucibus vestibulum. Blandit adipiscing eu felis iaculis volutpat ac adipiscing accumsan eu faucibus. Integer ac pellentesque praesent.',
                  },
                  {
                    name: 'Item 2',
                    description:
                      'Lorem ipsum dolor vestibulum ante ipsum primis in faucibus vestibulum. Blandit adipiscing eu felis iaculis volutpat ac adipiscing accumsan eu faucibus. Integer ac pellentesque praesent.',
                  },
                  {
                    name: 'Item 3',
                    description:
                      'Lorem ipsum dolor vestibulum ante ipsum primis in faucibus vestibulum. Blandit adipiscing eu felis iaculis volutpat ac adipiscing accumsan eu faucibus. Integer ac pellentesque praesent.',
                  },
                ]}
              />
            </Block>
          </Block>
          <Block>
            <Title level={5}>Actions</Title>
            <Block>
              <Title level={6}>Small</Title>
              <List
                items={[
                  {
                    id: '1',
                    content: (
                      <a href="#" className="button primary small">
                        Primary
                      </a>
                    ),
                  },
                  {
                    id: '2',
                    content: (
                      <a href="#" className="button small">
                        Small
                      </a>
                    ),
                  },
                  {
                    id: '3',
                    content: (
                      <a href="#" className="button small">
                        Icon only
                      </a>
                    ),
                  },
                  {
                    id: '4',
                    content: (
                      <a href="#" className="button small">
                        Text with icon
                      </a>
                    ),
                  },
                  {
                    id: '5',
                    content: (
                      <a href="#" className="button small">
                        Disabled
                      </a>
                    ),
                  },
                ]}
              />
            </Block>
            <Block>
              <Title level={6}>Default</Title>
              <List
                items={[
                  {
                    id: '1',
                    content: (
                      <a href="#" className="button primary">
                        Primary
                      </a>
                    ),
                  },
                  {
                    id: '2',
                    content: (
                      <a href="#" className="button">
                        Default
                      </a>
                    ),
                  },
                  {
                    id: '3',
                    content: (
                      <a href="#" className="button">
                        Icon only
                      </a>
                    ),
                  },
                  {
                    id: '4',
                    content: (
                      <a href="#" className="button">
                        Text with icon
                      </a>
                    ),
                  },
                  {
                    id: '5',
                    content: (
                      <a href="#" className="button">
                        Disabled
                      </a>
                    ),
                  },
                ]}
              />
            </Block>
            <Block>
              <Title level={6}>Large</Title>
              <List
                items={[
                  {
                    id: '1',
                    content: (
                      <a href="#" className="button primary large">
                        Primary
                      </a>
                    ),
                  },
                  {
                    id: '2',
                    content: (
                      <a href="#" className="button large">
                        Large
                      </a>
                    ),
                  },
                  {
                    id: '3',
                    content: (
                      <a href="#" className="button large">
                        Icon only
                      </a>
                    ),
                  },
                  {
                    id: '4',
                    content: (
                      <a href="#" className="button large">
                        Text with icon
                      </a>
                    ),
                  },
                  {
                    id: '5',
                    content: (
                      <a href="#" className="button large">
                        Disabled
                      </a>
                    ),
                  },
                ]}
              />
            </Block>
            <Block>
              <Title level={6}>Stacked</Title>
              <Block direction={DirectionEnum.ROW}>
                <Block>
                  <Title level={6}>Small</Title>
                  <List
                    items={[
                      {
                        id: '1',
                        content: (
                          <a href="#" className="button primary small">
                            Primary
                          </a>
                        ),
                      },
                      {
                        id: '2',
                        content: (
                          <a href="#" className="button small">
                            Small
                          </a>
                        ),
                      },
                      {
                        id: '3',
                        content: (
                          <a href="#" className="button small">
                            Icon only
                          </a>
                        ),
                      },
                      {
                        id: '4',
                        content: (
                          <a href="#" className="button small">
                            Text with icon
                          </a>
                        ),
                      },
                      {
                        id: '5',
                        content: (
                          <a href="#" className="button small">
                            Disabled
                          </a>
                        ),
                      },
                    ]}
                  />
                </Block>
                <Block>
                  <Title level={6}>Default</Title>
                  <List
                    items={[
                      {
                        id: '1',
                        content: (
                          <a href="#" className="button primary">
                            Primary
                          </a>
                        ),
                      },
                      {
                        id: '2',
                        content: (
                          <a href="#" className="button">
                            Default
                          </a>
                        ),
                      },
                      {
                        id: '3',
                        content: (
                          <a href="#" className="button">
                            Icon only
                          </a>
                        ),
                      },
                      {
                        id: '4',
                        content: (
                          <a href="#" className="button">
                            Text with icon
                          </a>
                        ),
                      },
                      {
                        id: '5',
                        content: (
                          <a href="#" className="button">
                            Disabled
                          </a>
                        ),
                      },
                    ]}
                  />
                </Block>
              </Block>
              <Block direction={DirectionEnum.ROW}>
                <Block>
                  <Title level={6}>Default</Title>
                  <List
                    items={[
                      {
                        id: '1',
                        content: (
                          <a href="#" className="button primary">
                            Primary
                          </a>
                        ),
                      },
                      {
                        id: '2',
                        content: (
                          <a href="#" className="button">
                            Default
                          </a>
                        ),
                      },
                      {
                        id: '3',
                        content: (
                          <a href="#" className="button">
                            Icon only
                          </a>
                        ),
                      },
                      {
                        id: '4',
                        content: (
                          <a href="#" className="button">
                            Text with icon
                          </a>
                        ),
                      },
                      {
                        id: '5',
                        content: (
                          <a href="#" className="button">
                            Disabled
                          </a>
                        ),
                      },
                    ]}
                  />
                </Block>
                <Block>
                  <Title level={6}>Large</Title>
                  <List
                    items={[
                      {
                        id: '1',
                        content: (
                          <a href="#" className="button primary large">
                            Primary
                          </a>
                        ),
                      },
                      {
                        id: '2',
                        content: (
                          <a href="#" className="button large">
                            Large
                          </a>
                        ),
                      },
                      {
                        id: '3',
                        content: (
                          <a href="#" className="button large">
                            Icon only
                          </a>
                        ),
                      },
                      {
                        id: '4',
                        content: (
                          <a href="#" className="button large">
                            Text with icon
                          </a>
                        ),
                      },
                      {
                        id: '5',
                        content: (
                          <a href="#" className="button large">
                            Disabled
                          </a>
                        ),
                      },
                    ]}
                  />
                </Block>
              </Block>
            </Block>
          </Block>
          <Block>
            <Block>
              <Title level={5}>Blockquote</Title>
              <Blockquote>
                Lorem ipsum dolor sit amet. Felis sagittis eget tempus euismod.
                Vestibulum ante ipsum primis in vestibulum. Blandit adipiscing
                eu iaculis volutpat ac adipiscing volutpat ac adipiscing
                faucibus.
              </Blockquote>
            </Block>
            <Block>
              <Title level={5}>Preformatted</Title>
              <Code>
                {`
i = 0;

while (!deck.isInOrder()) {
    print 'Iteration ' + (i++);
    deck.shuffle();
}

print 'It took ' + i + ' iterations to sort the deck.';
`}
              </Code>
            </Block>
          </Block>
          <Block>
            <Block>
              <Title level={5}>Icons</Title>
              <List
                items={[
                  {
                    id: '1',
                    content: (
                      <a href="#" className="icon fa-twitter">
                        <span className="label">Twitter</span>
                      </a>
                    ),
                  },
                  {
                    id: '2',
                    content: (
                      <a href="#" className="icon fa-facebook">
                        <span className="label">Facebook</span>
                      </a>
                    ),
                  },
                  {
                    id: '3',
                    content: (
                      <a href="#" className="icon fa-instagram">
                        <span className="label">Instagram</span>
                      </a>
                    ),
                  },
                  {
                    id: '4',
                    content: (
                      <a href="#" className="icon fa-github">
                        <span className="label">GitHub</span>
                      </a>
                    ),
                  },
                ]}
              />
            </Block>
            <Block>
              <Title level={5}>Social Icons</Title>
              <List
                items={[
                  {
                    id: '1',
                    content: (
                      <a href="#" className="icon fa-twitter">
                        <span className="label">Twitter</span>
                      </a>
                    ),
                  },
                  {
                    id: '2',
                    content: (
                      <a href="#" className="icon fa-facebook">
                        <span className="label">Facebook</span>
                      </a>
                    ),
                  },
                  {
                    id: '3',
                    content: (
                      <a href="#" className="icon fa-instagram">
                        <span className="label">Instagram</span>
                      </a>
                    ),
                  },
                  {
                    id: '4',
                    content: (
                      <a href="#" className="icon fa-github">
                        <span className="label">GitHub</span>
                      </a>
                    ),
                  },
                ]}
              />
            </Block>
          </Block>
          <Block>
            <Title level={5}>Table</Title>
            <Block>
              <Title level={6}>Default</Title>
              <Table
                items={[
                  {
                    Name: 'Item One',
                    Description: 'Ante turpis integer aliquet porttitor.',
                    Price: 29.99,
                  },
                  {
                    Name: 'Item Two',
                    Description: 'Vis ac commodo adipiscing arcu aliquet.',
                    Price: 19.99,
                  },
                  {
                    Name: 'Item Three',
                    Description: 'Morbi faucibus arcu accumsan lorem.',
                    Price: 29.99,
                  },
                  {
                    Name: 'Item Four',
                    Description: 'Vitae integer tempus condimentum.',
                    Price: 19.99,
                  },
                ]}
                footerItems={[{ Price: 100 }]}
              />
            </Block>
            <Block>
              <Title level={6}>Alternate</Title>
              <Table
                items={[
                  {
                    Name: 'Item One',
                    Description: 'Ante turpis integer aliquet porttitor.',
                    Price: 29.99,
                  },
                  {
                    Name: 'Item Two',
                    Description: 'Vis ac commodo adipiscing arcu aliquet.',
                    Price: 19.99,
                  },
                  {
                    Name: 'Item Three',
                    Description: 'Morbi faucibus arcu accumsan lorem.',
                    Price: 29.99,
                  },
                  {
                    Name: 'Item Four',
                    Description: 'Vitae integer tempus condimentum.',
                    Price: 19.99,
                  },
                ]}
                footerItems={[{ Price: 100 }]}
              />
            </Block>
          </Block>
          <Block>
            <Title level={5}>Form</Title>
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
          </Block>
          <Block>
            <Title level={5}>Image</Title>
            <Block>
              <Title level={6}>Fit</Title>
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
            </Block>
            <Block>
              <Title level={6}>Left &amp; Right</Title>
              <p>
                <span className="image left">
                  <img src="images/pic08.jpg" alt="" />
                </span>
                Lorem ipsum dolor sit accumsan interdum nisi, quis tincidunt
                felis sagittis eget. tempus euismod. Vestibulum ante ipsum
                primis in faucibus vestibulum. Blandit adipiscing eu felis
                iaculis volutpat ac adipiscing accumsan eu faucibus. Integer ac
                pellentesque praesent tincidunt felis sagittis eget. tempus
                euismod. Vestibulum ante ipsum primis sagittis eget. tempus
                euismod. Vestibulum ante ipsum primis in faucibus vestibulum.
                Blandit adipiscing eu felis iaculis volutpat ac adipiscing
                accumsan eu faucibus. Integer ac pellentesque praesent tincidunt
                felis sagittis eget. tempus euismod. Vestibulum ante ipsum
                primis in faucibus vestibulum. Blandit adipiscing eu felis
                iaculis volutpat ac adipiscing accumsan eu faucibus. Integer ac
                pellentesque praesent. Vestibulum ante ipsum primis in faucibus
                magna blandit adipiscing eu felis iaculis.
              </p>
              <p>
                <span className="image right">
                  <img src="images/pic09.jpg" alt="" />
                </span>
                Lorem ipsum dolor sit accumsan interdum nisi, quis tincidunt
                felis sagittis eget. tempus euismod. Vestibulum ante ipsum
                primis in faucibus vestibulum. Blandit adipiscing eu felis
                iaculis volutpat ac adipiscing accumsan eu faucibus. Integer ac
                pellentesque praesent tincidunt felis sagittis eget. tempus
                euismod. Vestibulum ante ipsum primis sagittis eget. tempus
                euismod. Vestibulum ante ipsum primis in faucibus vestibulum.
                Blandit adipiscing eu felis iaculis volutpat ac adipiscing
                accumsan eu faucibus. Integer ac pellentesque praesent tincidunt
                felis sagittis eget. tempus euismod. Vestibulum ante ipsum
                primis in faucibus vestibulum. Blandit adipiscing eu felis
                iaculis volutpat ac adipiscing accumsan eu faucibus. Integer ac
                pellentesque praesent. Vestibulum ante ipsum primis in faucibus
                magna blandit adipiscing eu felis iaculis.
              </p>
            </Block>
          </Block>
          <Block>
            <Title level={5}>Box</Title>
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
          </Block>
        </div>
      </div>
    </Layout>
  );
}

export default HomePage;
