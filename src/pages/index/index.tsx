import Taro, { Component, Config } from "@tarojs/taro";
import { View, Text } from "@tarojs/components";
import Scratch from "@/components/Scratch";
import "./index.scss";

export default class Index extends Component<
  {},
  {
    percentage1: number;
    percentage2: string | number;
  }
> {
  /**
   * 指定config的类型声明为: Taro.Config
   *
   * 由于 typescript 对于 object 类型推导只能推出 Key 的基本类型
   * 对于像 navigationBarTextStyle: 'black' 这样的推导出的类型是 string
   * 提示和声明 navigationBarTextStyle: 'black' | 'white' 类型冲突, 需要显示声明类型
   */
  config: Config = {
    navigationBarTitleText: "首页"
  };

  state = {
    percentage1: 0,
    percentage2: "loading image"
  };

  componentWillMount() {}

  componentDidMount() {}

  componentWillUnmount() {}

  componentDidShow() {}

  componentDidHide() {}

  render() {
    const { percentage1, percentage2 } = this.state;
    return (
      <View className="index">
        <Text className="title">Taro Scratch</Text>
        <Scratch
          maskColor="darkseagreen"
          style={{
            borderRadius: "50%",
            overflow: "hidden"
          }}
          onChange={p => {
            this.setState({
              percentage1: p
            });
          }}
        ></Scratch>
        <Text>{percentage1}%</Text>
        <Scratch
          maskImage="https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcTEy3eUqOHhwwhguB19qxzVMF8TEGl2VCRuCQ&usqp=CAU"
          width={300}
          height={170}
          onChange={p => {
            this.setState({
              percentage2: p + "%"
            });
          }}
          onReady={() => {
            this.setState({
              percentage2: "ready"
            });
          }}
        ></Scratch>
        <View>{percentage2}</View>
      </View>
    );
  }
}
