# LLMs Code

[![LLMs Code CI](https://github.com/WilliamWang1721/LLMs-Code/actions/workflows/ci.yml/badge.svg)](https://github.com/WilliamWang1721/LLMs-Code/actions/workflows/ci.yml)

![LLMs Code Screenshot](./docs/assets/llms-code-screenshot.png)

# 请注意：该项目目前已实现相关底层适配器工作，但仍未完成交互逻辑方面内容，当前处于不可用状态，请稍作等候！

这个仓库包含了LLMs Code，一个命令行AI工作流工具，它可以连接到你的工具，理解你的代码，并加速你的工作流程。

使用LLMs Code，你可以：

- 查询和编辑大型代码库，支持超过1M token的上下文窗口。
- 从PDF或草图生成新应用，使用多模态能力。
- 自动化操作任务，如查询拉取请求或处理复杂的rebase。
- 使用工具和MCP服务器连接新功能。
- 使用多种顶级大语言模型，包括OpenAI的GPT系列、Anthropic的Claude系列和Google的Gemini系列。

## 快速开始

1. **前提条件：** 确保你安装了[Node.js 20版本](https://nodejs.org/en/download)或更高版本。
2. **运行CLI：** 在终端中执行以下命令：

   ```bash
   npx https://github.com/WilliamWang1721/LLMs-Code
   ```

   或者安装它：

   ```bash
   npm install -g llms-code
   llms-code
   ```

3. **选择颜色主题**
4. **认证：** 根据提示，使用你的API密钥进行认证。

现在你可以使用LLMs Code了！

### 配置模型

LLMs Code支持多种大语言模型，你可以通过配置文件来设置：

1. 创建配置文件 `~/.llms-code/config.yaml`：

```yaml
# 界面语言，可选 'en' 或 'zh-CN'
language: zh-CN

# 默认使用的模型
default_model: gpt-4o

# 可用模型配置
models:
  - name: gpt-4o
    provider: openai
    api_key: env:OPENAI_API_KEY
    
  - name: claude-3-opus
    provider: anthropic
    api_key: env:ANTHROPIC_API_KEY
    
  - name: gemini-1.5-pro
    provider: gemini
    api_key: env:GEMINI_API_KEY
```

2. 设置环境变量：

   ```bash
# 对于OpenAI模型
export OPENAI_API_KEY="YOUR_API_KEY"

# 对于Anthropic模型
export ANTHROPIC_API_KEY="YOUR_API_KEY"

# 对于Gemini模型
   export GEMINI_API_KEY="YOUR_API_KEY"
   ```

3. 启动LLMs Code，它会自动使用配置文件中设置的默认模型：

```bash
llms-code
```

4. 你也可以在命令行中指定要使用的模型：

   ```bash
llms-code chat "你好" -m claude-3-opus
```

## 示例

一旦CLI运行起来，你可以开始从shell中与LLMs Code交互。

你可以从一个新目录开始一个项目：

```sh
cd new-project/
llms-code
> 帮我写一个Discord机器人，它可以使用我提供的FAQ.md文件回答问题
```

或者处理现有项目：

```sh
git clone https://github.com/WilliamWang1721/LLMs-Code
cd LLMs-Code
llms-code
> 给我一个昨天所有更改的摘要
```

### 下一步

- 了解如何[贡献或从源代码构建](./CONTRIBUTING.md)。
- 探索可用的**[CLI命令](./docs/cli/commands.md)**。
- 如果遇到任何问题，请查看**[故障排除指南](./docs/troubleshooting.md)**。
- 有关更全面的文档，请参阅[完整文档](./docs/index.md)。
- 查看一些[常见任务](#常见任务)以获取更多灵感。

### 故障排除

如果你遇到问题，请查看[故障排除](docs/troubleshooting.md)指南。

## 常见任务

### 探索新代码库

首先`cd`进入现有或新克隆的仓库，然后运行`llms-code`。

```text
> 描述这个系统架构的主要部分。
```

```text
> 有哪些安全机制？
```

### 处理现有代码

```text
> 为GitHub issue #123实现一个初稿。
```

```text
> 帮我将这个代码库迁移到最新版本的Java。从计划开始。
```

### 自动化工作流程

使用MCP服务器将本地系统工具与企业协作套件集成。

```text
> 为我制作一个幻灯片，显示过去7天的git历史，按功能和团队成员分组。
```

```text
> 为墙面显示器制作一个全屏Web应用，显示我们最多交互的GitHub问题。
```

### 与系统交互

```text
> 将此目录中的所有图像转换为png，并使用exif数据中的日期重命名它们。
```

```text
> 按支出月份组织我的PDF发票。
```

### 卸载

请查看[卸载](docs/Uninstall.md)指南了解卸载说明。

## 服务条款和隐私声明

有关适用于您使用LLMs Code的服务条款和隐私声明的详细信息，请参阅[服务条款和隐私声明](./docs/tos-privacy.md)。
