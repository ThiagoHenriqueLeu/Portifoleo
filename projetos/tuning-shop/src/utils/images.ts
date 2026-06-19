export function safeProductImage(image?: string) {
  if (!image || image.startsWith("blob:")) {
    return "";
  }

  return image;
}
