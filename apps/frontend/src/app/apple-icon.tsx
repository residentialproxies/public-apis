import { ImageResponse } from "next/og";

// 图片元数据 - Apple Touch Icon 标准尺寸
export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

// 生成 Apple Touch Icon
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        fontSize: 120,
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontWeight: "bold",
        fontFamily: "sans-serif",
        borderRadius: "20%", // iOS 风格圆角
      }}
    >
      AN
    </div>,
    {
      ...size,
    },
  );
}
