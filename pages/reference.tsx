import classNames from 'classnames';
import { NextSeo } from 'next-seo';
import React from 'react';
import { Background } from '../features/common';
import { Action, ActionMode } from '../features/common/Action';
import { Block } from '../features/common/Block';
import { Blockquote } from '../features/common/Blockquote';
import { Code } from '../features/common/Code';
import { Variation } from '../features/common/color';
import {
  descriptions,
  firstName,
  lastName,
  url,
} from '../features/common/data.json';
import { Definition } from '../features/common/Definition';
import { Heading } from '../features/common/Heading';
import { Icon, IconType } from '../features/common/Icon';
import { IconProps } from '../features/common/Icon/Icon';
import { Layout } from '../features/common/Layout';
import { Link } from '../features/common/Link';
import { List } from '../features/common/List';
import { ListMode } from '../features/common/List/List';
import { Size } from '../features/common/size';
import { Table } from '../features/common/Table';
import { TableMode } from '../features/common/Table/Table';
import { Text, TextEnum } from '../features/common/Text';
import { TextInput } from '../features/common/TextInput';
import { Title, TitleProps } from '../features/common/Title';

function HomePage() {
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
            {Object.keys(ListMode).map((listMode: ListMode) => (
              <Block key={listMode}>
                <Title level={6} classnames={['capitalize']}>
                  {listMode.toLowerCase()}
                </Title>
                <List
                  mode={listMode}
                  items={[
                    { id: '1', content: 'Dolor pulvinar etiam.' },
                    { id: '2', content: 'Sagittis lorem eleifend.' },
                    { id: '3', content: 'Felis feugiat dolore viverra.' },
                    { id: '4', content: 'Felis enim feugiat.' },
                  ]}
                />
              </Block>
            ))}
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
            {Object.keys(ActionMode).map((actionMode: ActionMode) => (
              <Block key={actionMode}>
                <Title level={6} classnames={['capitalize']}>
                  {actionMode.toLowerCase()}
                </Title>
                <List
                  items={Object.keys(Size).map((size: Size) => ({
                    id: `${actionMode}-${size}`,
                    content: (
                      <>
                        {Object.keys(Variation).map((variation: Variation) => (
                          <Action
                            key={`${actionMode}-${size}-${variation}`}
                            href="#"
                            mode={actionMode}
                            size={size}
                            variation={variation}>
                            <span className="capitalize">
                              {variation.toLowerCase()}
                            </span>
                          </Action>
                        ))}
                      </>
                    ),
                  }))}
                />
              </Block>
            ))}
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
            <Title level={5}>Icons</Title>
            <List
              items={Object.keys(IconType).reduce(
                (acc, iconType: IconType) =>
                  acc.concat(
                    Object.keys(Size).map((size: Size) => ({
                      id: `${iconType}-${size}`,
                      content: (
                        <>
                          {[undefined, Variation.DARK, Variation.LIGHT].map(
                            (variation: IconProps['variation']) => (
                              <Icon
                                key={`${iconType}-${size}-${variation}`}
                                type={iconType}
                                size={size}
                                variation={variation}
                              />
                            )
                          )}
                        </>
                      ),
                    }))
                  ),
                []
              )}
            />
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
                mode={TableMode.ALTERNATE}
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
              <Block>
                <Title level={6}>Text Input</Title>
                <TextInput label="Name" placeholder="Jane Doe" />
                <TextInput label="Email" placeholder="jane@untitled.tld" />
              </Block>
              <Block>
                <Title level={6}>Select Input</Title>
                <select name="demo-category" id="demo-category">
                  <option value="">-</option>
                  <option value="1">Manufacturing</option>
                  <option value="1">Shipping</option>
                  <option value="1">Administration</option>
                  <option value="1">Human Resources</option>
                </select>
              </Block>
              <Block>
                <Title level={6}>Radio Input</Title>
                <div className="field quarter">
                  <input
                    type="radio"
                    id="demo-priority-low"
                    name="demo-priority"
                    className="color2"
                    checked
                    onChange={() => {}}
                  />
                  <label htmlFor="demo-priority-low">Low Priority</label>
                </div>
                <div className="field quarter">
                  <input
                    type="radio"
                    id="demo-priority-high"
                    name="demo-priority"
                    className="color2"
                    onChange={() => {}}
                  />
                  <label htmlFor="demo-priority-high">High Priority</label>
                </div>
              </Block>
              <Block>
                <Title level={6}>Checkbox Input</Title>
                <div className="field quarter">
                  <input
                    type="checkbox"
                    id="demo-copy"
                    name="demo-copy"
                    className="color2"
                    onChange={() => {}}
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
                    onChange={() => {}}
                  />
                  <label htmlFor="demo-human">Not a robot</label>
                </div>
                {/* <div className="field">
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
                      onChange={() => {}}
                    />
                  </li>
                  <li>
                    <input type="reset" value="Reset" onChange={() => {}} />
                  </li>
                </ul> */}
              </Block>
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
