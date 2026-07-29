# Extended Fields in Agent Description Documents

This guide explains how extended fields are used in the Agent Description
examples in this repository. It supplements the
[Agent Description Protocol specification](../07-anp-agent-description-protocol-specification.md);
it does not add new protocol requirements.

The examples combine three kinds of terms:

- fields defined by the Agent Description Protocol;
- terms from an external vocabulary, such as Schema.org; and
- ANP-specific terms identified by the `ad` prefix.

Keeping these groups separate makes a description easier to interpret and
reduces the chance that two fields with the same short name are treated as the
same property.

## Declaring Vocabularies

The hotel and coffee shop examples use a JSON-LD context:

```json
{
  "@context": {
    "@vocab": "https://schema.org/",
    "did": "https://w3id.org/did#",
    "ad": "https://service.agent-network-protocol.com/ad#"
  }
}
```

`@vocab` supplies the vocabulary for unprefixed terms such as `name`,
`address`, and `telephone`. The `ad` prefix identifies fields and types that
belong to the ANP description vocabulary. The `did` prefix is available for
DID-related terms.

Use a prefix for a field that is not defined by the default vocabulary. Do not
reuse an existing vocabulary term with a different meaning.

## Extensions Used by the Examples

### `ad:domainEntity`

| Property | Value |
| --- | --- |
| Expected type | object |
| Required | No |
| Used in | Hotel and coffee shop Agent Descriptions |

`ad:domainEntity` associates an agent with the real-world or digital entity it
represents. Its contents depend on the domain. The hotel example uses a
Schema.org `Hotel`; the coffee shop example uses `CafeOrCoffeeShop`.

```json
{
  "ad:domainEntity": {
    "@type": "Hotel",
    "name": "Example Hotel",
    "telephone": "+1-555-0100"
  }
}
```

Prefer an established type and properties from the declared vocabulary for the
object's contents. Add a separate prefixed term only when the selected
vocabulary does not express the required information.

### `ad:products`

| Property | Value |
| --- | --- |
| Expected type | array |
| Required | No |
| Used in | Coffee shop Agent Description |

`ad:products` lists products exposed by the domain entity. Each entry can
contain a short inline description and an `@id` that points to a more detailed
Product document.

```json
{
  "ad:products": [
    {
      "@type": "Product",
      "name": "House Coffee",
      "description": "The shop's standard brewed coffee.",
      "@id": "https://example.com/products/house-coffee.json"
    }
  ]
}
```

Use a stable, dereferenceable `@id` when product details are stored in a
separate document. Avoid copying a complete product record into the Agent
Description when a link is sufficient.

### `ad:interfaces`

| Property | Value |
| --- | --- |
| Expected type | array |
| Required | No |
| Used in | Hotel and coffee shop Agent Descriptions |

`ad:interfaces` lists the interfaces through which another agent can interact
with the described agent. The examples use ANP-specific interface types with
`protocol`, `url`, and `description` fields.

```json
{
  "ad:interfaces": [
    {
      "@type": "ad:NaturalLanguageInterface",
      "protocol": "YAML",
      "url": "https://example.com/api/nl-interface.yaml",
      "description": "Natural-language inquiries and responses."
    }
  ]
}
```

The current examples contain the following interface types:

| Type | Purpose |
| --- | --- |
| `ad:NaturalLanguageInterface` | Conversational requests expressed in natural language |
| `ad:SearchInterface` | Structured search and filtering |
| `ad:BookingInterface` | Reservations or bookings |
| `ad:PurchaseInterface` | Product or service purchases |

An interface entry describes how to find the interface contract; it is not the
contract itself. Place endpoint paths, request parameters, and response schemas
in the linked interface document.

For an operation that needs direct user approval, the Agent Description
specification defines the boolean `humanAuthorization` field. Set it on the
relevant interface rather than assuming that authentication alone grants
permission to perform the operation.

### `ad:securityDefinitions` and `ad:security`

| Property | Expected type | Required by the current specification |
| --- | --- | --- |
| `ad:securityDefinitions` | object | Yes |
| `ad:security` | string | Yes |

The JSON-LD examples prefix the security fields with `ad`. The first field
defines the available security schemes; the second selects one of those
definitions by name.

```json
{
  "ad:securityDefinitions": {
    "didwba_sc": {
      "scheme": "didwba",
      "in": "header",
      "name": "Authorization"
    }
  },
  "ad:security": "didwba_sc"
}
```

These fields describe the authentication mechanism. They must not contain
private keys, bearer tokens, passwords, or other credentials.

### Product customization

The coffee product examples use `customizationOptions` with the ANP-specific
type `ad:CustomizationOptions`. Its `options` array contains `PropertyValue`
objects that describe the choices available to a buyer.

```json
{
  "customizationOptions": {
    "@type": "ad:CustomizationOptions",
    "options": [
      {
        "@type": "PropertyValue",
        "name": "Size",
        "isRequired": true,
        "value": ["Small", "Medium", "Large"]
      }
    ]
  }
}
```

In these examples, `isRequired` means that the buyer must select a value for
that option. It does not make `customizationOptions` a required field in every
Product document.

When an interface accepts these selections, its request schema should use the
same option names and permitted values as the Product document.

## Adding a Domain-Specific Field

Before adding a field:

1. Check whether the Agent Description specification already defines it.
2. Check whether the declared external vocabulary contains a term with the
   intended meaning.
3. If neither does, declare or reuse a suitable prefix and use it consistently.
4. State the expected JSON type and whether the field is optional or required
   within the extension.
5. Add a small example and update the interface contract if the field is used
   as an input or output.

Extensions should remain optional unless a separate specification makes them
mandatory. A consumer that does not understand an optional extension should
still be able to read the agent's identity, description, security settings, and
interface links.

## Related Examples

- [Hotel Agent Description](../examples/adp/hotel/examples/ad.json)
- [Hotel room description](../examples/adp/hotel/examples/hotel_room.json)
- [Coffee shop Agent Description](../examples/adp/lkcoffe/ad.json)
- [Coffee purchase interface](../examples/adp/lkcoffe/api/purchase-interface.yaml)

## Copyright Notice

Copyright (c) 2024 GaoWei Chang

This file is released under the [MIT License](../LICENSE). You are free to use
and modify it, but you must retain this copyright notice.
