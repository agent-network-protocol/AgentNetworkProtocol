# ANP-智能体描述协议规范

- 文档编号：ANP-07
- 标题：ANP-智能体描述协议规范
- 状态：已发布
- 版本：1.1
- 语言：中文
- 适用范围：本规范适用于 ANP 中智能体描述文档、接口描述与能力发布。

## 摘要

本规范定义了智能体描述协议（Agent Description Protocol, ADP），这是一个用于描述智能体的标准化协议。它定义了一个智能体如何对外发布其公开信息、支持的Interface等。其他智能体获得这个智能体的描述后，就可以与这个智能体进行信息的交换以及协作。

本规范定义了基于ANP协议，两个智能体之间的信息交互模式。

规范的核心内容包括：
1. 使用JSON作为基础数据格式，支持链接数据和语义网特性
2. 定义了智能体基本信息、产品、服务、接口等核心词汇
3. 采用did:wba方法作为统一的安全机制，实现跨平台身份认证。身份认证方法也是可扩展的，后期可以支持其他的方法
4. 支持与现有标准协议（如OpenAPI、JSON-RPC）的互操作性

本规范旨在提高智能体之间的互操作性和通信效率，为构建智能体网络提供基础支持。

信息交互模式的设计，兼容性的设计，

## 概述

智能体描述（Agent Description,AD）文档是访问一个智能体的入口，类似于一个网站的首页。其他的智能体基于此AD文档，获得智能体的名字、所属实体、功能、产品、服务、交互API或协议等信息。借助这些信息，可以实现智能体之间的数据通信与协作。

本规范主要解决两个问题，一是定义两个智能体之间的信息交互模式，另外一个是定义智能体描述文档的格式。

### 信息交互模式

ANP采用的是类似“网络爬虫”的信息交互模式，即智能体使用URL将对外提供的数据（文件、API等）以及数据的描述连接成一个网络，其他的智能体可以像爬虫一样，根据数据的描述信息，选择读取合适的数据到本地，并且在本地进行决策和处理。如果是一个API文件，也可以调用API和智能体进行交互。

![anp-information-interact](/images/anp-information-interact.png)

“网络爬虫”模式的信息交互模式具有以下几个优点：
- 与现有互联网架构类似，便于搜索引擎对智能体公开信息进行索引，创建一个高效的智能体数据网络
- 将远端数据拉取到本地，作为模型上下文进行处理，将有助于避免用户隐私的泄漏。任务分包的交互模式，会在任务中泄漏用户隐私。
- 天然的分级结构，便于智能体与大量其他的智能体进行交互。

### 核心概念

Information和Interface是ANP智能体描述规范的核心概念。

information是智能体对外提供的数据，包括文本文件、图片、视频、音频等。

interface是智能体对外提供的接口，Interface分为两类接口：
- 一类是自然语言接口，可以让智能体以自然语言的方式，提供更加个性化的服务；
- 一类是结构化接口，可以让智能体提供更加高效、标准化的服务。

虽然使用模型的能力，自然语言接口可以满足绝大部分的场景，但是结构化接口在很多场景中，可以提高智能体之间的通信效率。所以我们目前即支持结构化接口，又支持自然语言接口，可以做到兼顾效率和个性化。如果有结构化接口，模型应该有限选择结构化接口，如果结构化接口无法满足用户的需求，可以使用自然语言接口。

建议所有的智能体都支持自然语言接口。

## 智能体描述文档格式

智能体描述文档是一个智能体对外的入口。

受益于AI能力的提升，智能体描述文档可以全部使用自然语言描述，其他智能体也基本上可以理解其表达的信息。但是出于智能体使用的模型并不相同，模型的能力有差异，为了让绝大大部分的模型都可以对一个数据有统一、准确的理解，我们仍然建议智能体描述文档采用结构化的方式描述。未来增加个性化表达能力，文档内部可以大量的使用自然语言。

### 符合ANP规范的智能体描述

在智能体描述格式上，我们推荐使用JSON格式。我们定义了一个符合ANP规范的，基于普通json的智能体描述文档格式。

#### 智能体描述文档

以下是个智能体描述文档示例：

```json
{
  "protocolType": "ANP",
  "protocolVersion": "1.0.0",
  "type": "AgentDescription",
  "url": "https://grand-hotel.com/agents/hotel-assistant/ad.json",
  "name": "Grand Hotel Assistant",
  "did": "did:wba:grand-hotel.com:service:hotel-assistant",
  "owner": {
    "type": "Organization",
    "name": "Grand Hotel Management Group",
    "url": "https://grand-hotel.com"
  },
  "description": "Grand Hotel Assistant is an intelligent hospitality agent providing comprehensive hotel services including room booking, concierge services, guest assistance, and real-time communication capabilities.",
  "created": "2024-12-31T12:00:00Z",
  "securityDefinitions": {
    "didwba_sc": {
      "scheme": "didwba",
      "in": "header",
      "name": "Authorization"
    }
  },
  "security": "didwba_sc",
  "Infomations": [
    {
      "type": "Product",
      "description": "Luxury hotel rooms with premium amenities and personalized services.",
      "url": "https://grand-hotel.com/products/luxury-rooms.json"
    },
    {
      "type": "Product", 
      "description": "Comprehensive concierge and guest services including dining, spa, and local attractions.",
      "url": "https://grand-hotel.com/products/concierge-services.json"
    },
    {
      "type": "Information",
      "description": "Complete hotel information including facilities, amenities, location, and policies.",
      "url": "https://grand-hotel.com/info/hotel-basic-info.json"
    },
    {
      "type": "VideoObject",
      "description": "Hotel virtual tour showcasing rooms, facilities, dining areas, and recreational amenities.",
      "url": "https://grand-hotel.com/media/hotel-tour-video.mp4"
    }
  ],
  "interfaces": [
    {
      "type": "NaturalLanguageInterface",
      "protocol": "YAML",
      "version": "1.2.2",
      "url": "https://grand-hotel.com/api/nl-interface.yaml",
      "description": "Natural language interface for conversational hotel services and guest assistance."
    },
    {
      "type": "StructuredInterface",
      "protocol": "YAML",
      "humanAuthorization": true,
      "version": "1.1",
      "url": "https://grand-hotel.com/api/booking-interface.yaml",
      "description": "Structured interface for hotel room booking and reservation management."
    },
    {
      "type": "StructuredInterface",
      "protocol": "openrpc",
      "url": "https://grand-hotel.com/api/services-interface.json",
      "description": "openrpc interface for accessing hotel services and amenities."
    },
    {
      "type": "StructuredInterface",
      "protocol": "openrpc",
      "description": "OpenRPC interface for accessing hotel services.",
      "content": {}  // 详细内容参见下文 "openrpc 接口描述文档" 章节
    },
    {
      "type": "StructuredInterface",
      "protocol": "MCP",
      "version": "1.0",
      "url": "https://grand-hotel.com/api/mcp-interface.json",
      "description": "MCP-compatible interface for seamless integration with MCP-based systems."
    },
    {
      "type": "StructuredInterface",
      "protocol": "WebRTC",
      "version": "1.0",
      "url": "https://grand-hotel.com/api/webrtc-interface.yaml",
      "description": "WebRTC interface for real-time video communication and streaming services."
    }
  ],
  "proof": {
    "type": "EcdsaSecp256r1Signature2019",
    "created": "2024-12-31T15:00:00Z",
    "proofPurpose": "assertionMethod",
    "verificationMethod": "did:wba:grand-hotel.com:service:hotel-assistant#keys-1",
    "challenge": "1235abcd6789",
    "proofValue": "z58DAdFfa9SkqZMVPxAQpic7ndSayn1PzZs6ZjWp1CktyGesjuTSwRdoWhAfGFCF5bppETSTojQCrfFPP2oumHKtz"
  }
}

```

##### 酒店智能体描述文档字段说明

| 字段名称 | 类型 | 是否必需 | 描述 |
|---------|------|---------|------|
| protocolType | string | 必需 | 协议类型标识，固定值为"ANP" |
| protocolVersion | string | 必需 | ANP协议版本号，当前为"1.0.0" |
| type | string | 必需 | 文档类型标识，智能体描述文档为"AgentDescription" |
| url | string | 可选 | 智能体的网络访问地址，用于标识智能体位置 |
| name | string | 必需 | 智能体的人类可读名称，如"Grand Hotel Assistant" |
| did | string | 可选 | 智能体的去中心化标识符，用于身份验证 |
| owner | object | 可选 | 智能体所有者信息，包含组织名称和网址 |
| description | string | 可选 | 智能体的详细功能描述和服务说明 |
| created | string | 可选 | 智能体描述文档的创建时间，ISO 8601格式 |
| securityDefinitions | object | 必需 | 安全机制定义，包含认证方式和参数位置 |
| security | string | 必需 | 启用的安全配置名称，引用securityDefinitions中的定义 |
| Infomations | array | 可选 | 智能体提供的信息资源列表，包含产品、服务、媒体文件等 |
| interfaces | array | 可选 | 智能体支持的交互接口列表，包含各种协议和API |
| proof | object | 可选 | 数字签名和完整性校验信息，防止文档篡改 |

##### Information对象字段说明

| 字段名称 | 类型 | 描述 |
|---------|------|------|
| type | string | 信息类型，如"Product"、"Information"、"VideoObject"等 |
| description | string | 信息内容的详细描述 |
| url | string | 信息资源的访问地址 |

##### Interface对象字段说明

| 字段名称 | 类型 | 描述 |
|---------|------|------|
| type | string | 接口类型，如"NaturalLanguageInterface"、"StructuredInterface" |
| protocol | string | 接口使用的协议，如"YAML"、"openrpc"、"MCP"、"WebRTC" |
| version | string | 接口版本号 |
| url | string | 接口定义文档的地址 |
| description | string | 接口功能和用途的描述 |
| humanAuthorization | boolean | 是否需要人工授权，适用于敏感操作如预订付款 |


#### 产品（Product）描述文档

下面是一个产品（Product）的描述示例：

```json
{
  "protocolType": "ANP",
  "protocolVersion": "1.0.0",
  "type": "Product",
  "url": "https://grand-hotel.com/products/deluxe-suite.json",
  "identifier": "deluxe-suite-001",
  "name": "豪华套房",
  "description": "拥有独立客厅和卧室的豪华套房，配备全景落地窗、高级音响系统和智能家居控制。适合商务人士和高端客户入住。",
  "security": {
    "didwba": {
      "scheme": "didwba",
      "in": "header",
      "name": "Authorization"
    }
  },
  "brand": {
    "type": "Brand",
    "name": "Grand Hotel"
  },
  "additionalProperty": [
    {
      "type": "PropertyValue",
      "name": "房间面积",
      "value": "80平方米"
    },
    {
      "type": "PropertyValue", 
      "name": "床型",
      "value": "特大号床 (King Size)"
    }
  ],
  "offers": {
    "type": "Offer",
    "price": "1288",
    "priceCurrency": "CNY",
    "availability": "https://schema.org/InStock",
    "priceValidUntil": "2025-12-31"
  },
  "amenityFeature": [
    {
      "type": "LocationFeatureSpecification",
      "name": "免费WiFi",
      "value": true
    },
    {
      "type": "LocationFeatureSpecification", 
      "name": "空调",
      "value": true
    }
  ],
  "category": "Hotel Room",
  "sku": "GH-DELUXE-SUITE-001",
  "image": [
    {
      "type": "ImageObject",
      "url": "https://grand-hotel.com/images/deluxe-suite-bedroom.jpg",
      "caption": "豪华套房 - 卧室区域",
      "description": "配备特大号床和高级床品的宽敞卧室"
    },
    {
      "type": "ImageObject",
      "url": "https://grand-hotel.com/images/deluxe-suite-living.jpg", 
      "caption": "豪华套房 - 客厅区域",
      "description": "独立客厅配备沙发、茶几和工作区"
    },
    {
      "type": "ImageObject",
      "url": "https://grand-hotel.com/images/deluxe-suite-view.jpg",
      "caption": "豪华套房 - 城市景观",
      "description": "全景落地窗提供绝佳的城市景观"
    }
  ],
  "audience": {
    "type": "Audience",
    "audienceType": "商务客户、高端旅客",
    "geographicArea": "全球"
  },
  "manufacturer": {
    "type": "Organization", 
    "name": "Grand Hotel Management Group",
    "url": "https://grand-hotel.com"
  }
}
```

##### 产品描述文档字段说明

| 字段名称 | 类型 | 是否必需 | 描述 |
|---------|------|---------|------|
| protocolType | string | 必需 | 协议类型标识，固定值为"ANP" |
| protocolVersion | string | 必需 | ANP协议版本号 |
| type | string | 必需 | 对象类型，产品为"Product" |
| url | string | 可选 | 产品信息的网络地址 |
| identifier | string | 可选 | 产品的唯一标识符 |
| name | string | 必需 | 产品名称 |
| description | string | 必需 | 产品详细描述 |
| brand | object | 可选 | 产品品牌信息 |
| additionalProperty | array | 可选 | 产品的额外属性和特征 |
| offers | object | 可选 | 产品的价格和可用性信息 |
| amenityFeature | array | 可选 | 产品提供的设施和功能 |
| category | string | 可选 | 产品分类 |
| sku | string | 可选 | 产品SKU编码 |
| image | array | 可选 | 产品图片列表 |
| audience | object | 可选 | 目标客户群体 |
| manufacturer | object | 可选 | 产品提供商信息 |

#### openrpc 接口描述文档

下面是一个符合OpenRPC规范的接口描述文档示例：

```json
{
  "openrpc": "1.3.2",
  "info": {
    "title": "Grand Hotel Services API",
    "version": "1.0.0",
    "description": "JSON-RPC 2.0 API for hotel services including room management, booking, and guest services",
    "x-anp-protocol-type": "ANP",
    "x-anp-protocol-version": "1.0.0"
  },
  "security": [
    {
      "didwba": []
    }
  ],
  "servers": [
    {
      "name": "Production Server",
      "url": "https://grand-hotel.com/api/v1/hotel/jsonrpc",
      "description": "Production server for Grand Hotel API"
    }
  ],
  "methods": [
    {
      "name": "searchRooms",
      "summary": "Search available hotel rooms",
      "description": "Search available hotel rooms based on criteria such as dates, number of guests, and room type",
      "params": [
        {
          "name": "searchCriteria",
          "description": "Room search criteria",
          "required": true,
          "schema": {
            "type": "object",
            "properties": {
              "checkIn": {
                "type": "string",
                "format": "date",
                "description": "Check-in date in YYYY-MM-DD format"
              },
              "checkOut": {
                "type": "string", 
                "format": "date",
                "description": "Check-out date in YYYY-MM-DD format"
              },
              "guests": {
                "type": "integer",
                "minimum": 1,
                "maximum": 8,
                "description": "Number of guests"
              },
              "roomType": {
                "type": "string",
                "enum": ["standard", "deluxe", "suite", "presidential"],
                "description": "Preferred room type"
              }
            },
            "required": ["checkIn", "checkOut", "guests"]
          }
        }
      ],
      "result": {
        "name": "searchResult",
        "description": "Search results containing available rooms",
        "schema": {
          "type": "object",
          "properties": {
            "rooms": {
              "type": "array",
              "items": {
                "$ref": "#/components/schemas/Room"
              }
            },
            "total": {
              "type": "integer",
              "description": "Total number of available rooms"
            }
          }
        }
      }
    },
    {
      "name": "makeReservation",
      "summary": "Create hotel reservation",
      "description": "Create a new hotel reservation with guest information and booking details",
      "params": [
        {
          "name": "reservationData",
          "description": "Reservation information",
          "required": true,
          "schema": {
            "type": "object",
            "properties": {
              "roomId": {
                "type": "string",
                "description": "Unique room identifier"
              },
              "guestInfo": {
                "$ref": "#/components/schemas/GuestInfo"
              },
              "checkIn": {
                "type": "string",
                "format": "date",
                "description": "Check-in date"
              },
              "checkOut": {
                "type": "string",
                "format": "date",
                "description": "Check-out date"
              },
              "specialRequests": {
                "type": "string",
                "description": "Special requests or preferences"
              }
            },
            "required": ["roomId", "guestInfo", "checkIn", "checkOut"]
          }
        }
      ],
      "result": {
        "name": "reservationResult",
        "description": "Reservation confirmation details",
        "schema": {
          "type": "object",
          "properties": {
            "reservationId": {
              "type": "string",
              "description": "Unique reservation identifier"
            },
            "confirmationNumber": {
              "type": "string",
              "description": "Booking confirmation number"
            },
            "totalAmount": {
              "type": "number",
              "description": "Total reservation amount"
            }
          }
        }
      }
    }
  ],
  "components": {
    "securitySchemes": {
      "didwba": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "DID-WBA",
        "description": "DID-WBA authentication scheme"
      }
    },
    "schemas": {
      "Room": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "Unique room identifier"
          },
          "type": {
            "type": "string",
            "description": "Room type"
          },
          "price": {
            "type": "number",
            "description": "Room price per night"
          },
          "amenities": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "List of room amenities"
          },
          "availability": {
            "type": "boolean",
            "description": "Room availability status"
          }
        }
      },
      "GuestInfo": {
        "type": "object",
        "properties": {
          "firstName": {
            "type": "string",
            "description": "Guest's first name"
          },
          "lastName": {
            "type": "string",
            "description": "Guest's last name"
          },
          "email": {
            "type": "string",
            "format": "email",
            "description": "Guest's email address"
          },
          "phone": {
            "type": "string",
            "description": "Guest's phone number"
          }
        },
        "required": ["firstName", "lastName", "email"]
      }
    }
  }
}
```

##### OpenRPC规范字段说明

| 字段名称 | 类型 | 是否必需 | 描述 |
|---------|------|---------|------|
| openrpc | string | 必需 | OpenRPC规范版本，当前使用"1.3.2" |
| info | object | 必需 | API基本信息，包含标题、版本、描述等 |
| servers | array | 可选 | 服务器列表，定义API端点地址 |
| methods | array | 必需 | 可调用的方法列表 |
| components | object | 可选 | 可复用的组件定义，包括schemas和securitySchemes |
| security | array | 可选 | 安全要求定义 |


##### Info对象字段说明

| 字段名称 | 类型 | 描述 |
|---------|------|------|
| title | string | API名称 |
| version | string | API版本号 |
| description | string | API功能描述 |
| x-anp-protocol-type | string | ANP扩展字段：协议类型 |
| x-anp-protocol-version | string | ANP扩展字段：ANP协议版本 |


##### Method对象字段说明

| 字段名称 | 类型 | 描述 |
|---------|------|------|
| name | string | 方法名称，用于RPC调用 |
| summary | string | 方法简要描述 |
| description | string | 方法详细功能描述 |
| params | array | 输入参数列表，每个参数包含name、description、required和schema |
| result | object | 返回结果定义，包含name、description和schema |

##### Components对象字段说明

| 字段名称 | 类型 | 描述 |
|---------|------|------|
| schemas | object | 数据结构定义，用于复用 |
| securitySchemes | object | 安全认证方案定义 |

#### MCP server接口文档描述

待补充


### JSON-LD格式



### 安全机制

智能体描述协议当前使用did:wba方法作为其安全机制。did:wba方法是一种基于Web的去中心化标识符（DID）规范，旨在满足跨平台身份认证和智能体通信的需求。

未来可以根据需求扩展其他的身份认证方案。

#### DIDWBASecurityScheme（DID WBA安全方案）

描述基于did:wba方法的安全机制配置的元数据。分配给scheme名称的值必须在智能体描述中包含的词汇表中定义。

对于所有安全方案，任何密钥、密码或其他直接提供访问权限的敏感信息都不得存储在AD中，而应通过其他机制以带外方式共享和存储。AD的目的是描述如何访问智能体（如果消费者已经获得授权），而不是用于授予该授权。

安全方案通常需要额外的认证参数，例如数字签名等。这些信息的位置由与name关联的值指示，通常与in的值结合使用。与in关联的值可以采用以下值之一：

- header：参数将在协议提供的头部中给出，头部的名称由name的值提供。在did:wba方法中，身份验证信息通过Authorization头部传递。
- query：参数将作为查询参数附加到URI，查询参数的名称由name提供。
- body：参数将在请求负载的主体中提供，使用的数据模式元素由name提供。
- cookie：参数存储在由name值标识的cookie中。
- uri：参数嵌入在URI本身中，由相关交互中定义的URI模板变量（由name的值定义）进行编码。
- auto：位置作为协议的一部分确定或协商。如果SecurityScheme的in字段设置为auto值，则不应设置name字段。

表2：安全方案级别的词汇术语

| 词汇术语 | 描述 | 是否必需 | 类型 |
|---------|------|---------|------|
| type | 对象类型标识，用于为对象添加语义标签。 | 可选 | string |
| description | 基于默认语言提供额外的（人类可读）信息。 | 可选 | string |
| scheme | 安全机制的标识 | 必需 | string |
| in | 认证参数的位置。 | 必需 | string |
| name | 认证参数的名称。 | 必需 | string |

以下是一个使用did:wba方法的安全配置示例：

```json
{
    "securityDefinitions": {
        "didwba_sc": {
            "scheme": "didwba",
            "in": "header",
            "name": "Authorization"
        }
    },
    "security": "didwba_sc"
}
```

AD中的安全配置是必需的。必须通过智能体级别的security成员激活安全定义。此配置是与智能体交互所需的安全机制。

当security出现在AD文档的顶层时，表示所有的资源在访问是必须使用此安全机制进行验证。出现在某个资源内部时，表示只有在满足此安全机制的情况下才能访问该资源。如果顶层指定的security和资源中指定的security不相同，以资源中指定的security为准。

### 人类手动授权

如果一个接口在调用的时候，必须经过人类的手动授权，比如购买接口。这个时候可以在接口定义中添加字段humanAuthorization。true表示接口调用需要经过人类的手动授权才能够访问。

`humanAuthorization` 用于声明接口级的人类授权要求。它不是 DID 验证关系或授权凭证，也不能证明授权已经完成。基于 DID 的请求认证仍使用 [ANP-03](/chinese/03-did-wba方法规范.md) 中由 `authentication` 引用的验证方法。如何取得或证明人类授权不属于该字段的定义范围，应由适用的业务协议和授权策略确定。

### Proof（完整性校验）

为了防止AD文档被恶意篡改、假冒或重复使用，我们在AD文档中增加了校验信息Proof。Proof定义可以参考规范：[https://www.w3.org/TR/vc-data-integrity/#defn-domain](https://www.w3.org/TR/vc-data-integrity/#defn-domain)。

其中：
- domain: 定义了AD文档的存储的域名。使用者在获得文档后，必须要判断获得文档的域名是否与domain中定义的域名相同。如果不相同，则此文档可能是假冒的。
- challenge: 定义了校验的挑战信息，用于防止篡改。在指定domain的时候，需要同时指定challenge。
- verificationMethod：定义了校验的方法，当前使用的是did:wba文档中的验证方法。未来可以扩展更多的方法。
- proofValue: 携带数字签名。生成规则如下：
  - 生成不含有proofValue字段的网站的AD文档
  - 使用[JCS(JSON Canonicalization Scheme)](https://www.rfc-editor.org/rfc/rfc8785)对上面的AD文档进行规范化，生成规范化字符串。
  - 使用SHA-256算法对规范化字符串进行哈希，生成hash值。
  - 使用客户端的私钥对hash值进行签名，生成签名值，并进行URL 安全的Base64编码。
  - 签名校验过程是上面过程的反向操作。


## 常用定义规范化

对于一个具体的产品或服务，比如一杯咖啡、一个玩具，可以使用schema.org的Product属性的子集，定义一个特定的类型，明确产品的描述方式。这样所有智能体在构造产品数据的时候，都可以使用统一的定义，以便在不同的智能体之间进行互操作。

对于接口也可以使用类似的方式。比如产品购买接口，我们可以定义一个统一购买接口规范，所有的智能体都可以使用统一的购买接口，以便在不同的智能体之间进行互操作。






## 版权声明  
Copyright (c) 2024 GaoWei Chang  
本文件依据 [MIT 许可证](./LICENSE) 发布，您可以自由使用和修改，但必须保留本版权声明。  
