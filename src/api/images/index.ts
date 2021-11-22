import text2png from 'text2png'
import sharp from "sharp"
async function text(ctx) {
    const dataUri = await text2png(ctx.params.text, {
      color: "#f7f7f7",
      font: '16px Lobster',
      textAlign: "center",
      backgroundColor: "#0c0c0c",
      padding: 100,
    });
    ctx.type="image/png";

    ctx.body = sharp(dataUri)
    .resize(300, 300);
}

export default {
  text,
};
