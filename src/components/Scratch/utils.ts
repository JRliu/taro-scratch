import Taro, { getImageInfo } from "@tarojs/taro";

const systemInfo = Taro.getSystemInfoSync();

const _imgCache: {
  [url: string]: {
    width: number;
    height: number;
    ref: any;
  };
} = {};

function getRealPx(px: number) {
  return (systemInfo.screenWidth / 375) * px;
}

/**
 * 获取节点 rect 信息
 * @param selector
 * @param node
 */
async function getNodeRect(
  selector: string,
  node?: Taro.Component | Taro.Page
) {
  return new Promise<Taro.NodesRef.BoundingClientRectCallbackResult>(
    (resolve, reject) => {
      try {
        const query = Taro.createSelectorQuery();
        if (node) {
          if (process.env.TARO_ENV !== "alipay" && node.$scope) {
            query.in(node.$scope);
          } else {
            query.in(node);
          }
        }
        query.select(selector).boundingClientRect();
        query.exec((rect: Taro.NodesRef.BoundingClientRectCallbackResult[]) => {
          resolve(rect[0]);
        });
      } catch (err) {
        reject(err);
      }
    }
  );
}

function getCanvasCtx(canvasId: string, ctx: Taro.Component) {
  if (process.env.TARO_ENV !== "h5") {
    return Taro.createCanvasContext(canvasId, ctx.$scope);
  } else {
    try {
      //@ts-ignore
      if (ctx.vnode && ctx.vnode.dom) {
        //@ts-ignore
        const dom = ctx.vnode.dom as HTMLDivElement;
        const $canvas = dom.querySelector<HTMLCanvasElement>(
          `canvas[canvasid="${canvasId}"]`
        );

        if ($canvas) {
          // @ts-ignore
          return $canvas.getContext("2d") as Taro.CanvasContext;
        }
      }
    } catch (error) {
      console.error(error);
    }
  }
}

/**
 * 获取图片实例
 * @param url
 */
async function getImageCtx(
  url: string
): Promise<{
  ref: any;
  width: number;
  height: number;
}> {
  if (_imgCache[url]) {
    return _imgCache[url];
  }

  if (process.env.TARO_ENV !== "h5") {
    const res = await getImageInfo({
      src: url
    });

    return {
      ref: res.path,
      width: res.width,
      height: res.height
    };
  } else {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.setAttribute("crossOrigin", "Anonymous");
      img.onload = () => {
        resolve({
          ref: img,
          width: img.width,
          height: img.height
        });
      };
      img.onerror = reject;
      img.src = url;
    });
  }
}

export default {
  getRealPx,
  getNodeRect,
  getCanvasCtx,
  getImageCtx
};
