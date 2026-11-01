# Customs Guide

Mock policy for the Portside demo. Not real carrier or customs rules.

## Commercial invoices and HS codes

Every shipment needs a commercial invoice listing each item's description, quantity, unit value and six-digit HS code. Generic descriptions such as "gift" or "accessories" are rejected. An incorrect HS code can lead to a customs hold or a reassessment of duties.

## De minimis thresholds

De minimis is the value below which an import skips duties. Portside uses these thresholds for planning:

- United States: USD 0, all goods are dutiable.
- European Union: EUR 0, VAT is due on all goods. Duties apply above EUR 150.
- United Kingdom: GBP 135 for duties. VAT is due on all goods.
- Canada: CAD 40 for taxes and CAD 150 for duties.
- Australia: AUD 1,000.
- New Zealand: NZD 1,000.

## EU VAT and IOSS

Shipments to the EU valued at EUR 150 or less can use the Import One-Stop Shop. With an IOSS number, VAT is collected at checkout and the parcel clears faster. Without one, VAT is collected on delivery, and the carrier adds a handling fee of EUR 6.

## Germany

German customs commonly inspects electronics, cosmetics and toys. Clearance normally takes 1 to 2 business days at the Frankfurt gateway. Goods above EUR 150 need a full import declaration, which adds 1 to 3 business days.

## United States

All US shipments require formal or informal entry and are dutiable. Tariff rates depend on the HS code and country of origin, so merchants should confirm the rate for each product before quoting landed cost.

## Customs holds

A shipment with status customs_hold is waiting on customs. Common causes are a missing or vague invoice, an incorrect HS code, a value that looks too low, a missing registration number, or a random inspection.

Most holds clear in 2 to 5 business days after customs receives the requested documents. Merchants have 10 business days to respond. After that, the parcel may be returned to origin or destroyed, at the merchant's cost.

## Landed cost

Landed cost is the product price plus shipping, duties, taxes and fees. Duties are usually calculated on the customs value, and in the EU, import VAT is calculated on the customs value plus duty and shipping.
