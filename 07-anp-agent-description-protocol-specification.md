# ANP Agent Description Protocol Specification

- Document ID: ANP-07
- Title: ANP Agent Description Protocol Specification
- Status: Released
- Version: 1.1
- Language: English
- Applicability: This specification applies to Agent Description documents, interface descriptions, and capability publication in ANP.

## Abstract

This specification defines the Agent Description Protocol (ADP), a standardized protocol for describing agents. It defines how an agent publishes its public information, supported interfaces, and other details. Once other agents obtain this agent's description, they can exchange information and collaborate with this agent.

This specification defines the information interaction patterns between two agents based on the ANP protocol.

The core content of the specification includes:
1. Using JSON as the basic data format, supporting linked data and semantic web features
2. Defining core vocabularies for agent basic information, products, services, interfaces, etc.
3. Adopting the did:wba method as a unified security mechanism to achieve cross-platform identity authentication. The identity authentication method is also extensible to support other methods in the future
4. Supporting interoperability with existing standard protocols (such as OpenAPI, JSON-RPC)

This specification aims to improve interoperability and communication efficiency between agents, providing foundational support for building agent networks.

Information interaction pattern design, compatibility design,

## Overview

The Agent Description (AD) document serves as the entry point for accessing an agent, similar to a website's homepage. Other agents can obtain information such as the agent's name, affiliated entity, capabilities, products, services, interaction APIs, or protocols from this AD document. With this information, data communication and collaboration between agents can be achieved.

This specification primarily addresses two issues: defining information interaction patterns between two agents, and defining the format of the agent description document.

### Information Interaction Pattern

ANP adopts an information interaction pattern similar to "web crawlers," where agents use URLs to connect externally provided data (files, APIs, etc.) and data descriptions into a network. Other agents can, like crawlers, select and retrieve appropriate data to their local environment based on the data descriptions, and then make decisions and process locally. If it is an API file, the agent can also call the API to interact with the agent.

![anp-information-interact](/images/anp-information-interact.png)

The "web crawler" style information interaction pattern has the following advantages:
- Similar to existing internet architecture, facilitating search engine indexing of agent public information, creating an efficient agent data network
- Pulling remote data to local for processing as model context helps avoid user privacy leakage. Task delegation interaction patterns may leak user privacy within tasks.
- Natural hierarchical structure, facilitating agent interaction with large numbers of other agents.

### Core Concepts

Information and Interface are the core concepts of the ANP Agent Description specification.

Information refers to data provided externally by the agent, including text files, images, videos, audio, etc.

Interface refers to APIs provided externally by the agent. Interfaces are divided into two categories:
- Natural language interfaces, which allow agents to provide more personalized services through natural language;
- Structured interfaces, which allow agents to provide more efficient, standardized services.

Although natural language interfaces can satisfy most scenarios using model capabilities, structured interfaces can improve communication efficiency between agents in many scenarios. Therefore, we currently support both structured and natural language interfaces, achieving a balance between efficiency and personalization. If structured interfaces are available, the model should prioritize structured interfaces; if structured interfaces cannot meet user needs, natural language interfaces can be used.

It is recommended that all agents support natural language interfaces.

## Agent Description Document Format

The agent description document serves as the external entry point for an agent.

Benefiting from improved AI capabilities, agent description documents can be entirely described in natural language, and other agents can basically understand the expressed information. However, since agents use different models with varying capabilities, to ensure that most models can have a unified and accurate understanding of the data, we still recommend that agent description documents adopt a structured description approach. To enhance personalized expression capabilities, documents can extensively use natural language internally.

### ANP-Compliant Agent Description

For agent description format, we recommend using JSON format. We have defined an ANP-compliant agent description document format based on standard JSON.

For practical guidance on the ANP-specific and domain-specific fields used by
the examples in this repository, see
[Extended Fields in Agent Description Documents](docs/agent-description-extended-fields-guide.md).

#### Agent Description Document

The following is an example of an agent description document:

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
      "content": {}  // See "OpenRPC Interface Description Document" section below for details
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

##### Hotel Agent Description Document Field Descriptions

| Field Name | Type | Required | Description |
|---------|------|---------|------|
| protocolType | string | Required | Protocol type identifier, fixed value "ANP" |
| protocolVersion | string | Required | ANP protocol version number, currently "1.0.0" |
| type | string | Required | Document type identifier, "AgentDescription" for agent description documents |
| url | string | Optional | Network access address of the agent, used to identify agent location |
| name | string | Required | Human-readable name of the agent, e.g., "Grand Hotel Assistant" |
| did | string | Optional | Decentralized identifier of the agent, used for identity verification |
| owner | object | Optional | Agent owner information, including organization name and URL |
| description | string | Optional | Detailed functional description and service explanation of the agent |
| created | string | Optional | Creation time of the agent description document, ISO 8601 format |
| securityDefinitions | object | Required | Security mechanism definitions, including authentication method and parameter location |
| security | string | Required | Name of enabled security configuration, referencing definition in securityDefinitions |
| Infomations | array | Optional | List of information resources provided by the agent, including products, services, media files, etc. |
| interfaces | array | Optional | List of interaction interfaces supported by the agent, including various protocols and APIs |
| proof | object | Optional | Digital signature and integrity verification information to prevent document tampering |

##### Information Object Field Descriptions

| Field Name | Type | Description |
|---------|------|------|
| type | string | Information type, such as "Product", "Information", "VideoObject", etc. |
| description | string | Detailed description of the information content |
| url | string | Access address of the information resource |

##### Interface Object Field Descriptions

| Field Name | Type | Description |
|---------|------|------|
| type | string | Interface type, such as "NaturalLanguageInterface", "StructuredInterface" |
| protocol | string | Protocol used by the interface, such as "YAML", "openrpc", "MCP", "WebRTC" |
| version | string | Interface version number |
| url | string | Address of the interface definition document |
| description | string | Description of interface functionality and purpose |
| humanAuthorization | boolean | Whether human authorization is required, applicable to sensitive operations like booking payments |


#### Product Description Document

The following is an example of a Product description:

```json
{
  "protocolType": "ANP",
  "protocolVersion": "1.0.0",
  "type": "Product",
  "url": "https://grand-hotel.com/products/deluxe-suite.json",
  "identifier": "deluxe-suite-001",
  "name": "Deluxe Suite",
  "description": "A luxurious suite featuring a separate living room and bedroom, equipped with panoramic floor-to-ceiling windows, premium audio system, and smart home controls. Ideal for business professionals and high-end guests.",
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
      "name": "Room Size",
      "value": "80 square meters"
    },
    {
      "type": "PropertyValue", 
      "name": "Bed Type",
      "value": "King Size Bed"
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
      "name": "Free WiFi",
      "value": true
    },
    {
      "type": "LocationFeatureSpecification", 
      "name": "Air Conditioning",
      "value": true
    }
  ],
  "category": "Hotel Room",
  "sku": "GH-DELUXE-SUITE-001",
  "image": [
    {
      "type": "ImageObject",
      "url": "https://grand-hotel.com/images/deluxe-suite-bedroom.jpg",
      "caption": "Deluxe Suite - Bedroom Area",
      "description": "Spacious bedroom with king-size bed and premium bedding"
    },
    {
      "type": "ImageObject",
      "url": "https://grand-hotel.com/images/deluxe-suite-living.jpg", 
      "caption": "Deluxe Suite - Living Area",
      "description": "Separate living room with sofa, coffee table, and work area"
    },
    {
      "type": "ImageObject",
      "url": "https://grand-hotel.com/images/deluxe-suite-view.jpg",
      "caption": "Deluxe Suite - City View",
      "description": "Panoramic floor-to-ceiling windows offering excellent city views"
    }
  ],
  "audience": {
    "type": "Audience",
    "audienceType": "Business travelers, high-end guests",
    "geographicArea": "Global"
  },
  "manufacturer": {
    "type": "Organization", 
    "name": "Grand Hotel Management Group",
    "url": "https://grand-hotel.com"
  }
}
```

##### Product Description Document Field Descriptions

| Field Name | Type | Required | Description |
|---------|------|---------|------|
| protocolType | string | Required | Protocol type identifier, fixed value "ANP" |
| protocolVersion | string | Required | ANP protocol version number |
| type | string | Required | Object type, "Product" for products |
| url | string | Optional | Network address of product information |
| identifier | string | Optional | Unique identifier of the product |
| name | string | Required | Product name |
| description | string | Required | Detailed product description |
| brand | object | Optional | Product brand information |
| additionalProperty | array | Optional | Additional properties and characteristics of the product |
| offers | object | Optional | Price and availability information of the product |
| amenityFeature | array | Optional | Facilities and features provided by the product |
| category | string | Optional | Product category |
| sku | string | Optional | Product SKU code |
| image | array | Optional | Product image list |
| audience | object | Optional | Target customer group |
| manufacturer | object | Optional | Product provider information |

#### OpenRPC Interface Description Document

The following is an example of an interface description document conforming to the OpenRPC specification:

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

##### OpenRPC Specification Field Descriptions

| Field Name | Type | Required | Description |
|---------|------|---------|------|
| openrpc | string | Required | OpenRPC specification version, currently using "1.3.2" |
| info | object | Required | API basic information, including title, version, description, etc. |
| servers | array | Optional | Server list, defining API endpoint addresses |
| methods | array | Required | List of callable methods |
| components | object | Optional | Reusable component definitions, including schemas and securitySchemes |
| security | array | Optional | Security requirement definitions |


##### Info Object Field Descriptions

| Field Name | Type | Description |
|---------|------|------|
| title | string | API name |
| version | string | API version number |
| description | string | API functionality description |
| x-anp-protocol-type | string | ANP extension field: protocol type |
| x-anp-protocol-version | string | ANP extension field: ANP protocol version |


##### Method Object Field Descriptions

| Field Name | Type | Description |
|---------|------|------|
| name | string | Method name, used for RPC calls |
| summary | string | Brief method description |
| description | string | Detailed method functionality description |
| params | array | Input parameter list, each parameter includes name, description, required, and schema |
| result | object | Return result definition, including name, description, and schema |

##### Components Object Field Descriptions

| Field Name | Type | Description |
|---------|------|------|
| schemas | object | Data structure definitions for reuse |
| securitySchemes | object | Security authentication scheme definitions |

#### MCP Server Interface Document Description

To be supplemented


### Security Mechanism

The Agent Description Protocol currently uses the did:wba method as its security mechanism. The did:wba method is a web-based Decentralized Identifier (DID) specification designed to meet the needs of cross-platform identity authentication and agent communication.

Other identity authentication schemes can be extended based on future requirements.

#### DIDWBASecurityScheme (DID WBA Security Scheme)

Describes the metadata for configuring security mechanisms based on the did:wba method. The value assigned to the scheme name must be defined in the vocabulary included in the agent description.

For all security schemes, any keys, passwords, or other sensitive information that directly provides access must not be stored in the AD, but should be shared and stored out-of-band through other mechanisms. The purpose of the AD is to describe how to access the agent (if the consumer has already been authorized), not to grant that authorization.

Security schemes typically require additional authentication parameters, such as digital signatures. The location of this information is indicated by the value associated with name, usually combined with the value of in. The value associated with in can take one of the following values:

- header: The parameter will be given in a header provided by the protocol, with the header name provided by the value of name. In the did:wba method, authentication information is passed through the Authorization header.
- query: The parameter will be appended to the URI as a query parameter, with the query parameter name provided by name.
- body: The parameter will be provided in the body of the request payload, with the data schema element used provided by name.
- cookie: The parameter is stored in a cookie identified by the value of name.
- uri: The parameter is embedded in the URI itself, encoded by the URI template variable defined in the related interaction (defined by the value of name).
- auto: The location is determined or negotiated as part of the protocol. If the in field of a SecurityScheme is set to the auto value, the name field should not be set.

Table 2: Security Scheme Level Vocabulary Terms

| Vocabulary Term | Description | Required | Type |
|---------|------|---------|------|
| type | Object type identifier, used to add semantic tags to objects. | Optional | string |
| description | Provides additional (human-readable) information based on the default language. | Optional | string |
| scheme | Security mechanism identifier | Required | string |
| in | Location of authentication parameters. | Required | string |
| name | Name of authentication parameters. | Required | string |

The following is an example of a security configuration using the did:wba method:

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

Security configuration in the AD is required. Security definitions must be activated through the security member at the agent level. This configuration is the security mechanism required for interacting with the agent.

When security appears at the top level of the AD document, it indicates that all resources must be verified using this security mechanism when accessed. When it appears inside a specific resource, it indicates that the resource can only be accessed when this security mechanism is satisfied. If the security specified at the top level differs from the security specified in a resource, the security specified in the resource takes precedence.

### Human Manual Authorization

If an interface requires human manual authorization when called, such as a purchase interface, the field humanAuthorization can be added to the interface definition. A value of true indicates that the interface call requires human manual authorization to access.

`humanAuthorization` indicates an interface-level human-authorization requirement. It is not a DID verification relationship, an authorization credential, or proof that authorization has been completed. DID-based request authentication continues to use the verification methods referenced by `authentication` in [ANP-03](/03-did-wba-method-design-specification.md). How human authorization is obtained or evidenced is outside the scope of this field and is determined by the applicable business protocol and authorization policies.

### Proof (Integrity Verification)

To prevent AD documents from being maliciously tampered with, forged, or replayed, we have added verification information Proof to the AD document. The Proof definition can refer to the specification: [https://www.w3.org/TR/vc-data-integrity/#defn-domain](https://www.w3.org/TR/vc-data-integrity/#defn-domain).

Where:
- domain: Defines the domain where the AD document is stored. After obtaining the document, the user must verify that the domain from which the document was obtained matches the domain defined in domain. If they do not match, the document may be forged.
- challenge: Defines the verification challenge information, used to prevent tampering. When specifying domain, challenge must also be specified.
- verificationMethod: Defines the verification method, currently using the verification method in the did:wba document. More methods can be extended in the future.
- proofValue: Carries the digital signature. Generation rules are as follows:
  - Generate the website's AD document without the proofValue field
  - Use [JCS (JSON Canonicalization Scheme)](https://www.rfc-editor.org/rfc/rfc8785) to canonicalize the above AD document, generating a canonical string.
  - Use the SHA-256 algorithm to hash the canonical string, generating a hash value.
  - Use the client's private key to sign the hash value, generating a signature value, and perform URL-safe Base64 encoding.
  - The signature verification process is the reverse of the above process.


## Common Definition Standardization

For a specific product or service, such as a cup of coffee or a toy, a subset of schema.org's Product properties can be used to define a specific type, clarifying how the product is described. This way, all agents can use unified definitions when constructing product data, facilitating interoperability between different agents.

A similar approach can be used for interfaces. For example, for a product purchase interface, we can define a unified purchase interface specification that all agents can use, facilitating interoperability between different agents.





## Copyright Notice  
Copyright (c) 2024 GaoWei Chang  
This document is released under the [Apache License 2.0](./LICENSE). You are free to use and modify it under the terms of that license, but you must retain this copyright notice.
