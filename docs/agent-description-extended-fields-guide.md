# Extended Fields in Agent Description Documents

This guide explains the optional fields used by the hotel and coffee-shop
examples in this repository. It supplements the
[Agent Description Protocol specification](../07-anp-agent-description-protocol-specification.md)
and does not add new protocol requirements.

ANP-07 v1.1 uses standard JSON. Agent Description and Product documents use
ordinary field names such as `type` and `url`. The examples in this guide
follow that format.

## Start with the ANP-07 Fields

An Agent Description must contain the fields that ANP-07 marks as required.
Optional domain fields can then be added alongside them.

| Field | Type | Status | Purpose |
| --- | --- | --- | --- |
| `protocolType` | string | Required | Fixed value `ANP` |
| `protocolVersion` | string | Required | ANP protocol version used by the document |
| `type` | string | Required | `AgentDescription` for an Agent Description document |
| `url` | string | Optional | Address of the Agent Description document |
| `name` | string | Required | Human-readable agent name |
| `did` | string | Optional | DID used to identify the agent |
| `owner` | object | Optional | Person or organization responsible for the agent |
| `description` | string | Optional | Summary of the agent's purpose and capabilities |
| `created` | string | Optional | Creation time in ISO 8601 format |
| `securityDefinitions` | object | Required | Available authentication schemes |
| `security` | string | Required | Active entry from `securityDefinitions` |
| `Infomations` | array | Optional | Links to products, services, or other information resources |
| `interfaces` | array | Optional | Interfaces exposed by the agent |
| `proof` | object | Optional | Document integrity proof |

`Infomations` is the field name used by the current ANP-07 specification. The
examples retain that spelling for compatibility with the specification.

A minimal description with one domain extension looks like this:

```json
{
  "protocolType": "ANP",
  "protocolVersion": "1.0.0",
  "type": "AgentDescription",
  "url": "https://example.com/agents/hotel/ad.json",
  "name": "Hotel Booking Agent",
  "did": "did:wba:example.com:agents:hotel",
  "securityDefinitions": {
    "didwba_sc": {
      "scheme": "didwba",
      "in": "header",
      "name": "Authorization"
    }
  },
  "security": "didwba_sc",
  "domainEntity": {
    "type": "Hotel",
    "name": "Example Hotel",
    "telephone": "+1-555-0100"
  }
}
```

## Linking Information Resources

Use `Infomations` for resources that have their own documents. A short entry
states what the resource contains and where it can be retrieved.

```json
{
  "Infomations": [
    {
      "type": "Product",
      "description": "Room details, rates, and booking conditions.",
      "url": "https://example.com/products/deluxe-room.json"
    }
  ]
}
```

The linked Product document uses the standard fields defined in the Product
Description section of ANP-07. Keep detailed pricing, images, and product
properties in that document rather than copying them into the Agent
Description.

## Describing Interfaces

The examples use the two interface types defined by ANP-07:

- `NaturalLanguageInterface` for conversational requests;
- `StructuredInterface` for operations described by a machine-readable
  contract.

```json
{
  "interfaces": [
    {
      "type": "StructuredInterface",
      "protocol": "YAML",
      "version": "1.0",
      "humanAuthorization": true,
      "url": "https://example.com/api/booking-interface.yaml",
      "description": "Hotel room booking and reservation management."
    }
  ]
}
```

Endpoint paths, request parameters, and response schemas belong in the linked
interface contract. Set `humanAuthorization` to `true` when the operation
requires direct user approval, such as confirming a booking or purchase.

## Extensions Used by the Examples

### `domainEntity`

| Property | Value |
| --- | --- |
| Expected type | object |
| Required | No |
| Used in | Hotel and coffee-shop Agent Descriptions |

`domainEntity` describes the organization, place, or other entity represented
by the agent. The value is an ordinary JSON object. Its `type` identifies the
kind of entity, while the remaining fields describe that entity.

The hotel example includes address, location, rating, images, amenities, and
services. The coffee-shop example includes address, opening hours, telephone,
and location. These properties are optional and should be selected according
to the domain.

```json
{
  "domainEntity": {
    "type": "CafeOrCoffeeShop",
    "name": "Example Coffee Shop",
    "openingHours": "Mo-Su 07:00-22:00",
    "address": {
      "type": "PostalAddress",
      "addressLocality": "Example City",
      "addressCountry": "CN"
    }
  }
}
```

### `customizationOptions`

| Property | Value |
| --- | --- |
| Expected type | object |
| Required | No |
| Used in | Coffee Product documents |

`customizationOptions` lists choices that can be made when ordering a product.
Each item in `options` has a name, a list of accepted values, and an optional
`isRequired` flag.

```json
{
  "customizationOptions": {
    "type": "CustomizationOptions",
    "options": [
      {
        "type": "PropertyValue",
        "name": "Size",
        "isRequired": true,
        "value": ["Small", "Medium", "Large"]
      }
    ]
  }
}
```

`isRequired` applies to the individual choice. It does not make
`customizationOptions` mandatory for every Product document. A purchase
interface that accepts these choices should use the same option names and
permitted values.

### Hotel-room fields

The hotel-room Product adds fields that are useful when comparing rooms:

| Field | Type | Description |
| --- | --- | --- |
| `roomName` | string | Local or alternate room name |
| `useableArea` | string | Display value for room area |
| `capacity` | string | Guest capacity as published by the provider |
| `floor` | string | Floor or floor range |
| `bedType` | string | Bed configuration |
| `windowType` | string | Window configuration |
| `pricePerDay` | array | Daily prices covered by the offer |
| `stockPerDay` | array | Daily inventory covered by the offer |
| `instantConfirmation` | boolean | Whether the booking can be confirmed immediately |
| `containedInPlace` | object | Hotel or property containing the room |
| `smokingAllowed` | boolean | Whether smoking is permitted |
| `petsAllowed` | boolean | Whether pets are permitted |

These fields are optional extensions. If an offer contains `pricePerDay` and
`stockPerDay`, both arrays should cover the same ordered set of dates defined
by the interface request or surrounding response.

## Adding a Domain-Specific Field

Before adding a field:

1. Check whether ANP-07 already defines the field.
2. Check whether the public definition selected for the product or service
   already supplies a suitable name and value shape.
3. Use a concise field name whose meaning does not conflict with an existing
   field.
4. Document the JSON type and whether the extension is optional or required.
5. Add a representative example and update the interface contract when the
   field is accepted as input or returned as output.

Domain extensions should remain optional unless a separate specification
makes them mandatory. A consumer that does not use an extension should still
be able to read the agent's identity, security configuration, information
links, and interfaces.

## Related Examples

- [Hotel Agent Description](../examples/adp/hotel/examples/ad.json)
- [Hotel room Product document](../examples/adp/hotel/examples/hotel_room.json)
- [Hotel search interface](../examples/adp/hotel/examples/api/search-interface.yaml)
- [Coffee-shop Agent Description](../examples/adp/lkcoffe/ad.json)
- [Coffee Product document](../examples/adp/lkcoffe/silk-latte/silk-latte.json)
- [Coffee purchase interface](../examples/adp/lkcoffe/api/purchase-interface.yaml)

## Copyright Notice

Copyright (c) 2024 GaoWei Chang

This file is released under the [Apache License 2.0](../LICENSE). You are free
to use and modify it under the terms of that license, but you must retain this
copyright notice.
