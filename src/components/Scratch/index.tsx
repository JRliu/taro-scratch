import Taro, { Component } from "@tarojs/taro";
import { Canvas } from "@tarojs/components";
import { ITouchEvent } from "@tarojs/components/types/common";
import throttle from "lodash/throttle";
import utils from "./utils";

interface IProps {
  canvasId: string;
  width: number;
  height: number;
  scratchRadius: number;
  maskImage?: string;
  maskColor?: string;
  style?: React.CSSProperties;

  onReady?: (ctx: Scratch) => any;
  onChange?: (percent: number, ctx: Scratch) => any;
}
interface IState {
  sWidth: number;
  sHeight: number;
}

export default class Scratch extends Component<IProps, IState> {
  static defaultProps = {
    canvasId: "Scratch",
    width: 250,
    height: 250,
    scratchRadius: 10,
    maskColor: "#A6A6A6",
    onReady: () => {},
    onChange: () => {}
  };

  public state: IState = {
    sWidth: 0,
    sHeight: 0
  };

  public componentWillMount() {
    const { width, height } = this.props;

    this.setState({
      sWidth: utils.getRealPx(width),
      sHeight: utils.getRealPx(height)
    });
  }

  public componentDidMount() {
    const { canvasId } = this.props;

    this.canvasCtx = utils.getCanvasCtx(canvasId, this)!;

    setTimeout(() => {
      this.canvasCtx && this.drawMask(this.canvasCtx);
    }, 0);
  }

  canvasCtx: Taro.CanvasContext;

  private top = 0;

  private left = 0;

  /**
   * 清空画布
   */
  public clear() {
    const { sWidth, sHeight } = this.state;
    this.canvasCtx.clearRect(0, 0, sWidth, sHeight);
  }
  /**
   * 重置
   */
  public reset() {
    this.drawMask(this.canvasCtx);
  }

  /**
   * 更新canvas相对于屏幕的位置信息
   */
  protected updateCanvasPosition = async () => {
    const { canvasId } = this.props;
    const rect = await utils.getNodeRect(`#${canvasId}`, this);

    this.left = rect.left;
    this.top = rect.top;
  };

  /**
   * 画遮罩层
   * @param ctx
   */
  protected drawMask = async (ctx: Taro.CanvasContext) => {
    const { maskColor, maskImage, onReady } = this.props;
    const { sWidth: width, sHeight: height } = this.state;

    if (maskImage) {
      const res = await utils.getImageCtx(maskImage);

      ctx.drawImage(res.ref, 0, 0, width, height);

      if (process.env.TARO_ENV === "weapp") {
        ctx.draw(true);
      }
    } else {
      ctx.fillStyle = maskColor!;
      ctx.fillRect(0, 0, width, height);
      if (process.env.TARO_ENV === "weapp") {
        ctx.draw(true);
      }
    }

    setTimeout(() => {
      onReady && onReady(this);
    }, 0);
  };

  /**
   * 擦除
   *
   * @protected x,y: 坐标； r: 半径
   */
  protected eraser = (x: number, y: number, r: number) => {
    const { sWidth: width, sHeight: height } = this.state;
    const { top, left } = this;

    const ctx = this.canvasCtx;
    if (!ctx) {
      return;
    }

    const _y = y - top;
    const _x = x - left;

    if (process.env.TARO_ENV === "h5") {
      ctx.save();
      ctx.beginPath();
      ctx.arc(_x, _y, r, 0, Math.PI * 2, false);
      ctx.clip();
      ctx.clearRect(0, 0, width, height);
      ctx.restore();
    } else {
      ctx.save();
      ctx.beginPath();
      ctx.arc(_x, _y, r, 0, Math.PI * 2, false);
      ctx.clip();
      ctx.clearRect(0, 0, width, height);
      ctx.draw(true);
      ctx.restore();
    }
  };

  /**
   * 获取canvas的像素数据
   */
  protected getPixels = async () => {
    const { canvasId } = this.props;
    const { sHeight: height, sWidth: width } = this.state;
    if (process.env.TARO_ENV === "h5") {
      // @ts-ignore
      return this.canvasCtx.getImageData(0, 0, width, height).data;
    }

    if (process.env.TARO_ENV === "weapp") {
      const data = await Taro.canvasGetImageData(
        {
          canvasId,
          x: 0,
          y: 0,
          width: width,
          height: height
        },
        // @ts-ignore
        this.$scope
      );
      return data.data;
    }
  };

  /**
   * 获取已刮面积的百分比
   */
  protected getScratchedPercentage = async () => {
    const pixels = await this.getPixels();

    const transPixels: any[] = [];
    for (let i = 0; i < pixels.length; i += 4) {
      // 严格上来说，判断像素点是否透明需要判断该像素点的a值是否等于0，
      // 为了提高计算效率，这儿设置当a值小于128，也就是半透明状态时就可以了
      if (pixels[i + 3] < 128) {
        transPixels.push(pixels[i + 3]);
      }
    }

    return Number(
      ((transPixels.length / (pixels.length / 4)) * 100).toFixed(2)
    );
  };

  protected onTouchStart = async (e: ITouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    await this.updateCanvasPosition();

    const touch = e.changedTouches[0];

    // @ts-ignore
    const x = touch.clientX || touch.x || 0;
    // @ts-ignore
    const y = touch.clientY || touch.y || 0;
    const r = this.props.scratchRadius;

    this.eraser(x, y, r);
    this.triggerOnChange();
  };

  protected onTouchMove = (e: ITouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const touch = e.changedTouches[0];
    // @ts-ignore
    const x = touch.clientX || touch.x || 0;
    // @ts-ignore
    const y = touch.clientY || touch.y || 0;
    const r = this.props.scratchRadius;

    this.eraser(x, y, r);
    this.triggerOnChange();
  };

  protected onTouchEnd = async (e: ITouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    this.triggerOnChange();
  };

  protected triggerOnChange = throttle(async () => {
    const { onChange } = this.props;
    const percentage = await this.getScratchedPercentage();

    onChange && onChange(percentage, this);
  }, 300);

  public render() {
    const { canvasId, style = {} } = this.props;
    const { sWidth: width, sHeight: height } = this.state;

    const _style = Object.assign(style, {
      height: `${height}px`,
      width: `${width}px`
    });

    return (
      <Canvas
        canvasId={canvasId}
        id={canvasId}
        style={_style}
        onTouchStart={this.onTouchStart}
        onTouchMove={this.onTouchMove}
        onTouchEnd={this.onTouchEnd}
      ></Canvas>
    );
  }
}
