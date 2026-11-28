// The cabinet's stylesheet arrives as text, with the game (see canvas.game.ts).
declare module "*.css?inline" {
  const css: string;
  export default css;
}
