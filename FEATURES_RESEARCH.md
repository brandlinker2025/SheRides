# Ride-sharing features: what others ship, and what SheRides took

Research for the women-only Bangladesh product at sherides.online. Sources checked in November 2026: Uber saved places and promo help, inDrive promo help, Pathao Streak, Grab driver history, Maya Ride (Dhaka Tribune and mayaride.com.bd/safety), and HerRyde’s published safety page. Safr’s current public app is a healthcare-transport driver app; older reviews still describe a women-driving-women onboarding interview. Bolt, Careem, Didi, Gojek, and Ola are summarized from their long-standing rider products (estimate before request, saved places, live trip, two-way ratings, receipts, promos, scheduled rides, driver earnings). No paid API was added.

## What competitors actually do

| App | Features that matter for SheRides |
| --- | --- |
| Uber, Lyft, Bolt, Careem, Didi, Gojek, Ola | Fare before you request, saved home/work, live driver on a map, trip share, in-trip chat or call, two-way ratings, receipts, promo codes, scheduled rides, driver earnings, multiple stops on many of them. Payments are card or wallet. |
| Grab | Same core loop, plus a driver history screen: today, this week, cash vs wallet, and cancelled jobs. |
| inDrive | Passengers can offer a fare. Promo codes and bonuses sit in a wallet. |
| Pathao | Dhaka bike rides, promo codes, and Streak missions that pay points or another code after completed trips. |
| Maya (Dhaka) | Women riders, immediate rides when someone is free, pre-booked date and time, bike/scooter/car, and a separate kids commute. Safety copy is verification, support hours (6:00–21:00), and escalation. Not an in-app SOS button on the public safety page. |
| HerRyde | Women drivers, vetting before a driver can work, live trip sharing, fare estimates. Planned items (AI routes, anomaly detection, a smarter SOS) are marked as not launched. |
| Safr | Women-driver brand in older reviews, with an interview on top of a background check. The current Drive Safr listing is medical transport: schedules, live tracking, dispatch chat, and card payments. |

## Already in SheRides before this change

Scheduled rides and hourly hire, a fare estimate (OpenStreetMap search plus the in-app rate card), live ride status on Supabase Realtime, in-app chat, a share-trip link, ratings both ways after the ride, and an admin review for in-app rider and passenger applications. Going online and accepting a ride already failed in the database unless that application was approved.

## Implemented in this change

| Feature | Why it was worth building for free |
| --- | --- |
| Clear “waiting for approval” state | Pending riders were already blocked on the server. The screen now says they cannot go online or receive rides. |
| Partner-lead approve / reject | `/partner` leads had no status. Admins can approve or reject them. That decision does not create a login and does not let anyone go online. |
| Server backstop | `go_set_online` and `go_accept_ride` still require an approved rider application. A trigger on `go_rider_state` rejects `is_online = true` for anyone else. |
| Saved places | Home, work, and up to eight other places. Chips on the booking sheet fill pickup or drop-off. |
| Receipts | A completed ride shows pickup, drop-off, fare, pay method, and a print button. No payment processor. |
| Promo codes | `SHEWELCOME` is 10% off, capped so the fare cannot fall below ৳70 (৳250 for hire). The database, not the browser, changes the fare. |
| Favourite captains | A passenger can save an approved captain. Matching is still “nearest approved rider”, not a private dispatch. |
| Extra stops | Up to two stops, shared with the captain. The fare stays pickup-to-final-drop, because a free routing server is not a safe meter. |
| Earnings | Today, seven days, and all completed fares on the rider screen. It is a record of fares, not a payout. |
| Bangla / English | A toggle in the top bar for navigation, saved places, the waiting state, earnings, and receipts. |
| Light and dark | The theme control now switches the shared color tokens. The booking sheet stays on the dark pink sanctuary. |
| SOS removed | The safety page, the SOS button, and the admin SOS inbox are gone. Old `/safety` and `/admin/emergency-alerts` links redirect. Database SOS tables are left in place. |

## Deferred, and why

| Idea | Why it is not in this PR |
| --- | --- |
| Card or wallet checkout | Needs a paid processor. The owner asked for free tools only, and not to collect card details. Cash, bKash, and Nagad stay as labels on the ride. |
| In-app phone calls | Twilio, Agora, and similar meters are paid. Chat and the trip link cover contact. |
| Google Maps or paid traffic ETAs | Nominatim is already the free geocoder. Public OSRM is rate-limited and is a poor source for a fare you charge. |
| Surge pricing and inDrive-style bidding | Easy to get wrong without an ops team, and bidding changes the women-only safety promise (who you ride with should not be an auction). |
| Pathao Streak / points | Needs a rewards budget and abuse controls. A single welcome code is the free version. |
| AI route alarms and HerRyde-style SOS | The owner asked to remove SOS. Anomaly models are not free and are not a substitute for a person. |
| Maya Kids and car pools | A different product, with a different duty of care. The partner form can already record car interest. |
| Assigning a favourite captain automatically | Would skip the nearest-approved-rider rule and needs a dispatcher. Favourites are a list, not a lock. |
| New NID, licence photos, or password fields | Not added. Partner leads still store only name, phone, area, vehicle type, commitment, and an optional note. The older in-app application still uses the documents it already collected. |

## Migrations to apply

Run `supabase/migrations/20261116030000_partner_review_and_ride_extras.sql` in the Supabase SQL editor for project `irjybaasydqcfuldczeu`. It only adds columns, tables, functions, and one promo row. It does not drop SOS objects.
