import os
import random

from PIL import Image, ImageDraw, ImageSequence, ImageFont
import io

SUCCESS_MESSAGES = [
    "Nailed it!",
    "OMG, you did it",
    "You're cool",
    "Awesome job",
    "Wow, you are good"
]

FAILURE_MESSAGES = [
    "Really?",
    "Incorrect. So boring...",
    "WTF? Really?",
    "You failed"
]

ImageDraw.ImageDraw.font = ImageFont.truetype("FiraCode-Bold.ttf", 30)


def add_text_to_frame(frame: Image, text_type: str, text: str) -> Image:
    d = ImageDraw.Draw(frame)
    text = text.upper()

    text_width = len(text) * 18  # this is just an estimate based on the font size

    width = frame.width
    height = frame.height

    # draw success message
    # d.ink = 0x0000ff if text_type == "failure" else 0x00ff00
    # d.fontmode = "L"
    d.text(
        (width / 2 - text_width / 2, height - 40),
        text,
        fill=0x0000ff if text_type == "failure" else 0x00ff00,
        stroke_fill=0xffffff,
        stroke_width=1
    )
    del d

    # Saving the image without 'save_all' will turn it into a single frame image, and we can then re-open it
    # To be efficient, we will save it to a stream, rather than to file
    b = io.BytesIO()
    frame.save(b, format="GIF")
    return Image.open(b)


def add_text(filename: str, text_type: str):
    img = Image.open(f"pre-{text_type}-gifs/{filename}")

    message_pool = FAILURE_MESSAGES if text_type == "failure" else SUCCESS_MESSAGES
    message = message_pool.pop(0)
    frames = list(map(lambda frame: add_text_to_frame(frame, text_type, message), ImageSequence.Iterator(img)))
    message_pool.append(message)

    # save frames as new image
    out_dir = f"../{text_type}-gifs"
    if not os.path.exists(out_dir):
        os.mkdir(out_dir)

    out_file = f"{out_dir}/{filename}"
    frames[0].save(out_file, save_all=True, append_images=frames[1:])

    print(f"\t{out_file}")


def gen_gifs(text_type: str):
    print(f"Generating {text_type} gifs...")
    pre_gifs = os.listdir(f"pre-{text_type}-gifs")
    pre_gifs.sort()
    for pre_gif in pre_gifs:
        add_text(pre_gif, text_type)


def main():
    gen_gifs("success")
    gen_gifs("failure")


if __name__ == "__main__":
    main()
