import text2png from 'text2png'
import fs from "fs"
async function text(ctx) {
    const dataUri = await text2png(ctx.params.text, {
      color: "#f7f7f7",
      textAlign: "center",
      backgroundColor: "#0c0c0c",
      paddingTop: 100,
      paddingBottom: 100,
      paddingLeft: 10,
      paddingRight: 10,
    });
    ctx.type="image/png";

    ctx.body = dataUri;
}

export default {
  text,
};
