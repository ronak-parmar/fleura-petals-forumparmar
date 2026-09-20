# Fleuréa Petals – Flower Bouquet Ordering Application

> Master content for the TY project report. This is the source text used to rebuild
> `Project_report.docx`. Figure slots reference PNGs in `figures/`.

---

## TITLE PAGE

**FLEURÉA PETALS**
**FLOWER BOUQUET ORDERING APPLICATION**

A Project Report

Submitted in partial fulfillment of the requirements for the award of the degree of

**BACHELOR OF SCIENCE**
**(COMPUTER SCIENCE)**

By

**FORUM PARMAR**
Roll Number: 576

Under the esteemed guidance of
**Prof. Khushi Goda**
Assistant Professor

[LOGO]

NAGINDAS KHANDWALA COLLEGE
(Empowered Autonomous College)
(Affiliated to University of Mumbai)
MUMBAI – 400 064
MAHARASHTRA

2026 – 27

---

## CERTIFICATE

NAGINDAS KHANDWALA COLLEGE
(Empowered Autonomous College)
(Affiliated to University of Mumbai)
MUMBAI – 400 064
MAHARASHTRA

DEPARTMENT OF COMPUTER AND INFORMATION SCIENCE

[LOGO]

**CERTIFICATE**

This is to certify that the project titled **"Fleuréa Petals – Flower Bouquet Ordering Application"** is a bonafide work of **Forum Parmar** bearing Roll No: **576** and is submitted in partial fulfillment of the requirements for the award of the degree of **Bachelor of Science in Computer Science** from the University of Mumbai.

The project has been completed under the guidance of the project guide and represents the student's own work carried out as part of the field project requirements.

Date: ____________________
Place: Mumbai

Internal Guide          Project Coordinator          External Examiner

College Seal

---

## CERTIFICATE BY THE ORGANIZATION

This is to certify that **Forum Parmar**, Roll Number **576**, has carried out the field project titled **"Fleuréa Petals – Flower Bouquet Ordering Application"** for **Fleuréa Petals**.

The project was undertaken to understand the requirements of a small handmade flower business and to develop a simple digital application for showcasing bouquets, accepting customer orders and supporting custom bouquet requests.

Organization Name: Fleuréa Petals
Authorized Signature: ______________________________
Date: ____________________

---

## DECLARATION

I hereby declare that the project entitled **"Fleuréa Petals – Flower Bouquet Ordering Application"**, carried out at Nagindas Khandwala College, is my original work and has been completed as part of the field project requirements of the Bachelor of Science in Computer Science programme.

I further declare that this project has not been submitted, either wholly or partly, to any other university or institution for the award of any degree or qualification. The information presented in this report is based on the work carried out for the project and has been prepared for academic submission.

To the best of my knowledge, the work presented in this report is genuine and has been completed with the guidance and support provided during the project.

Signature: ______________________________
Name: Forum Parmar
Roll Number: 576

---

## ACKNOWLEDGEMENT

The successful completion of the field project entitled "Fleuréa Petals – Flower Bouquet Ordering Application" would not have been possible without the guidance, support, and encouragement of several individuals who contributed throughout the course of this project.

I would like to express my sincere gratitude to Prof. Dr. Moushumi Datta Ma'am, Director/Principal, Nagindas Khandwala College, for providing the opportunity and institutional support to undertake this field project.

I am deeply thankful to Prof. Dr. Mona Mehta Ma'am, Vice Principal/IQAC Co-ordinator, for her valuable guidance and encouragement.

I would also like to extend my heartfelt thanks to Dr. Preeti Tripathi Ma'am, Vice Principal, for her support and motivation throughout the project.

I express my sincere gratitude to Dr. Pallavi Tawde Ma'am, Department of Computer and Information Science Co-ordinator, for her constant support and encouragement.

I am especially grateful to my project guide, Prof. Khushi Goda Ma'am, for her valuable guidance, constructive suggestions, patience, and continuous support, which helped me successfully complete this project.

I would also like to thank my family and friends for their encouragement, support, and motivation throughout the development and completion of this field project.

Finally, I am thankful to everyone who directly or indirectly contributed to the successful completion of this project.

---

## ABSTRACT

**Fleuréa Petals – Flower Bouquet Ordering Application** is a web-based project developed for Fleuréa Petals, a small business that offers handmade flower bouquets and gifts. The purpose of the project is to give customers a simple and convenient way to view available bouquets, explore gift options and place orders online, and to give the business an organized way to receive and manage those orders.

The project focuses on the practical needs of a small flower business. Ordering through direct social-media messages or phone calls makes it difficult to present products consistently, capture customer requirements accurately and keep orders organized. The proposed application provides a structured digital platform where products are presented clearly, customers can build an order using a shopping cart, and personalized bouquet requirements can be submitted through a dedicated custom-request flow.

The application is built using **Next.js (React)** for the frontend, **ASP.NET Core Web API (.NET)** for the backend and **PostgreSQL** for the database, with **Visual Studio Code** as the development environment. It follows a three-tier architecture in which the presentation, application logic and data storage are handled as separate layers. A minimal administrator panel allows the business to manage products, view and update orders, and respond to custom bouquet requests. Online payment is intentionally excluded from the scope; orders are placed on a pay-on-delivery basis.

The project combines business understanding with software development. It aims not only to make ordering easier for customers but also to help Fleuréa Petals present its products, reach more customers and maintain a more organized ordering process.

---

## TABLE OF CONTENTS

| Sr. No. | Contents | Page No. |
|---|---|---|
| | **Chapter 1: Introduction** | |
| 1.1 | Project Overview | |
| 1.2 | Problem Statement | |
| 1.3 | Objectives | |
| 1.4 | Scope of the Project | |
| | **Chapter 2: Organization Profile and Field Study** | |
| 2.1 | About the Organization | |
| 2.2 | Organization Structure | |
| 2.3 | Services / Products Offered | |
| 2.4 | Existing Business Process | |
| 2.5 | Problem Identified During Field Study | |
| | **Chapter 3: System Analysis and Design** | |
| 3.1 | Existing System | |
| 3.2 | Proposed System | |
| 3.3 | Functional Requirements | |
| 3.4 | Non-Functional Requirements | |
| 3.5 | System Architecture | |
| 3.6 | Database Design | |
| 3.7 | UML Diagrams | |
| | **Chapter 4: System Implementation** | |
| 4.1 | Hardware Requirements | |
| 4.2 | Software Requirements | |
| 4.3 | Technologies Used | |
| 4.4 | Module Description | |
| 4.5 | User Interface Screens | |
| 4.6 | Sample Source Code | |
| | **Chapter 5: Testing and Results** | |
| 5.1 | Test Cases | |
| 5.2 | Results and Outputs | |
| | **Chapter 6: Conclusion and Future Scope** | |
| 6.1 | Conclusion | |
| 6.2 | Learning Outcomes | |
| 6.3 | Future Scope | |
| | **Chapter 7: References** | |
| | **Chapter 8: Appendix** | |

---

## LIST OF FIGURES

| Figure | Title |
|---|---|
| 3.1 | System architecture of Fleuréa Petals |
| 3.2 | Catalogue "two natures" logic |
| 3.3 | Entity–Relationship (ER) diagram |
| 3.4 | Database tables in PostgreSQL (pgAdmin view) |
| 3.5 | Database functions used by the API (pgAdmin view) |
| 3.6 | Use-case diagram |
| 3.7 | Activity diagram – Place an order |
| 3.8 | Sequence diagram – Checkout |
| 3.9 | Class diagram |
| 3.10 | Order status lifecycle |
| 3.11 | Custom request lifecycle |
| 4.1 | Home screen |
| 4.2 | Shop / catalogue screen |
| 4.3 | Product detail screen |
| 4.4 | Cart screen |
| 4.5 | Checkout screen |
| 4.6 | Order confirmation screen |
| 4.7 | Track order screen |
| 4.8 | Custom bouquet request form |
| 4.9 | Custom request received screen |
| 4.10 | Customer account – My Orders |
| 4.11 | Admin – Dashboard |
| 4.12 | Admin – Product form |
| 4.13 | Admin – Orders list |
| 4.14 | Admin – Order detail |
| 4.15 | Admin – Custom request detail |
| 5.1 | Test execution summary |

---

## LIST OF TABLES

| Table | Title |
|---|---|
| 3.1 | Functional requirements |
| 3.2 | Non-functional requirements |
| 3.3 | Database tables and key columns |
| 3.4 | Database functions used by the API |
| 4.1 | Hardware requirements |
| 4.2 | Software requirements |
| 4.3 | Technologies used |
| 4.4 | Module description |
| 5.1 | Functional test cases and results |
| 5.2 | Requirements traceability (FR → test) |
| 8.1 | Weekly activity log |

---

# CHAPTER 1: INTRODUCTION

## 1.1 Project Overview

Fleuréa Petals – Flower Bouquet Ordering Application is a web-based application designed around the requirements of a small handmade flower and gifting business. Fleuréa Petals offers flower bouquets and gifts with an emphasis on presentation, creativity and personalization. It works with two kinds of products: *everlasting* arrangements hand-wound from satin ribbon, floral wire and pipe cleaners, and *fresh* seasonal arrangements prepared the same day they are gifted. The purpose of the project is to bring the ordering process for both into a single, simple digital environment.

Today, customers usually discover small businesses through social media and then communicate through direct messages to ask about products, prices, availability and customization. While this is useful for personal communication, it becomes difficult to manage as the number of enquiries grows. A dedicated application provides a more organized way to display products and collect customer requirements.

The proposed application gives Fleuréa Petals a digital storefront where customers can browse handmade bouquets and gifts, add several items to a shopping cart and place an order in one structured step. It also supports **custom bouquet requests**, allowing a customer to describe a personalized arrangement — colours, occasion, size and budget — instead of being limited to predefined products. A small administrator panel lets the business manage the catalogue, track orders through their fulfilment stages and respond to custom requests.

Online payment is deliberately outside the scope of this project. Orders are recorded on a pay-on-delivery basis, which keeps the project focused on the ordering experience itself.

## 1.2 Problem Statement

Small flower businesses often depend on informal ordering methods such as social-media messages and phone calls. This leads to repeated questions, difficulty in tracking enquiries, unclear customer requirements and the absence of a single place where all products can be viewed with correct, up-to-date information. Order details end up scattered across different conversations, and there is no reliable record of what was ordered, for when, and at what stage each order is.

Fleuréa Petals requires a simple system that can present its handmade products clearly, make ordering convenient for customers, provide a structured way to request customized bouquets, and give the business an organized view of incoming orders. The project therefore addresses the need for a lightweight digital ordering application suitable for a small business, without the cost and complexity of a full commercial e-commerce platform.

## 1.3 Objectives

The main objectives of the project are:

1. To provide a clear online catalogue that showcases Fleuréa Petals' handmade flower bouquets and gifts, including both everlasting and fresh arrangements.
2. To make ordering simple and convenient for customers through a shopping cart and a single, guided checkout that captures delivery details.
3. To allow customers to place custom bouquet requests by describing their own requirements, and to let the business respond with a rough quote.
4. To give the business a minimal administrator panel for managing products, tracking orders through their fulfilment stages and handling custom requests, thereby making the overall ordering process more organized.

## 1.4 Scope of the Project

The scope of the project covers the presentation of bouquets and gifts, browsing and searching the catalogue, building an order using a cart, a guided checkout that records contact and delivery information, order confirmation and order tracking, and a dedicated custom bouquet request flow. Registered customer accounts are optional and add order history and saved addresses. The administrator side covers product and category management, order status management, custom-request handling and a simple dashboard.

The project focuses on the core ordering experience rather than a large-scale commercial platform. The following are explicitly **not** in scope:

- Online payment or any payment-gateway integration (orders are pay-on-delivery).
- Real-time stock counts; products carry an availability state (available, made to order, sold out) set by the administrator.
- Automated e-mail or SMS notifications; status information is shown within the application.
- Delivery routing, maps, courier integration or live delivery tracking.
- Customer reviews and ratings, wishlists, discount codes and loyalty programs.
- Multiple administrator roles and permissions.

These items are recorded as future scope in Chapter 6 so that the project boundary is clearly documented.

---

# CHAPTER 2: ORGANIZATION PROFILE AND FIELD STUDY

## 2.1 About the Organization

Fleuréa Petals is the organization for which this field project has been developed. It is a small business focused on handmade flower bouquets and gifts. The business provides attractive gifting options and also offers the possibility of creating bouquets according to individual customer preferences.

The identity of a handmade flower business is strongly connected with creativity and a personal touch. Customers buy bouquets for birthdays, anniversaries, celebrations, weddings, corporate gifting or simply to make someone feel special. Because of this, the business needs a presentation that communicates both the products themselves and the personalized nature of the service.

| Field | Detail |
|---|---|
| Organization name | Fleuréa Petals |
| Address | Mumbai, Maharashtra, India |
| Type of organization | Small handmade flower and gifting business |
| Nature of business | Design and sale of handmade flower bouquets and gifts; custom bouquet orders |
| Products | Ribbon blooms, pipe-cleaner posies, silk / everlasting bouquets, fresh same-day arrangements, gift pairings |

## 2.2 Organization Structure

Fleuréa Petals is a small business, so its activities are organized as functions rather than large departments. The proposed system is designed around the following functional areas:

- **Owner / Management:** takes overall decisions about products, pricing and how orders are fulfilled.
- **Bouquet Making:** designs and assembles ribbon, pipe-cleaner and silk arrangements, and prepares fresh arrangements on the day of delivery.
- **Order Handling:** receives customer orders, confirms details and schedules them for preparation.
- **Customization:** discusses custom bouquet requirements with customers and prepares a rough quote.
- **Delivery Coordination:** arranges delivery of completed orders on the requested date and time slot.
- **Customer Communication:** answers customer questions before and after an order.

In the current setup one or two people carry out all of these functions. The Fleuréa Petals application connects these activities through a single administrator panel so that products, orders and custom requests can be managed from one place.

## 2.3 Services / Products Offered

Fleuréa Petals offers handmade flower bouquets and gifts. The application is intended to present these products clearly so that customers can understand the available options before ordering. The product range is:

- **Ribbon Blooms** — hand-wound satin ribbon flowers, sold as single stems or built into full arrangements.
- **Pipe-Cleaner Posies** — playful, textured blooms with a soft handmade edge; popular as children's gifts and for shelf décor.
- **Silk / Everlasting Bouquets** — full, event-ready arrangements for weddings and venues that keep their appearance for years.
- **Fresh & Gifted** — same-day fresh flower bouquets, optionally paired with a small gift for the person receiving them.
- **Custom Bouquets** — arrangements made to a customer's own brief: colours, occasion, size and budget.

The everlasting products are made to order and have a short lead time. The fresh products are date-bound and are prepared on the day of delivery. This distinction is important and is carried through the application as a product attribute.

## 2.4 Existing Business Process

At present, a customer typically discovers Fleuréa Petals through social media or a personal reference. The customer then sends a direct message to ask about available bouquets, prices, customization and delivery. A conversation follows that covers product selection, any customization, quantity, the delivery date and address, and other requirements. The order is confirmed in the same conversation and payment is arranged informally.

This approach creates a personal relationship with the customer, but it has practical limits:

- Product information has to be repeated for every enquiry.
- Details of a single order are spread across a long chat and are easy to miss.
- There is no consolidated list of orders or their current stage.
- Custom requirements are described in a free-form way, so important details (budget, date, colours) are sometimes not captured.
- As the number of enquiries grows, response times increase.

## 2.5 Problem Identified During Field Study

The field study identified the absence of a structured digital ordering process designed around the needs of Fleuréa Petals. Product presentation, order collection and custom-request handling all happen inside chat conversations, with no single record of orders.

The study also showed what the solution should *not* be. A small business does not need a large e-commerce platform with many screens and options; that would make ordering harder, not easier, and would be costly to maintain. What is needed is a focused application that does a few things well: present the products, let a customer place an order in one guided step, accept a personalized request, and give the business an organized view of everything that comes in. This finding directly shaped the scope defined in Chapter 1.

---

# CHAPTER 3: SYSTEM ANALYSIS AND DESIGN

## 3.1 Existing System

The existing process depends on direct customer communication through social media and informal product presentation. To learn about products, a customer must contact the business and ask. Ordering happens inside a chat, and there is no application maintaining product, customer or order data.

Limitations of the existing system:

- Product information is not presented in one consistent place and must be repeated on request.
- Orders are not recorded in a structured form; there is no order number and no status.
- Custom requirements are captured informally and inconsistently.
- The business has no consolidated view of pending and completed orders.
- The process works for a few customers at a time but does not scale.

## 3.2 Proposed System

The proposed system is a web-based flower bouquet ordering application for Fleuréa Petals. The frontend is built with **Next.js (React)**, the backend is an **ASP.NET Core Web API**, and **PostgreSQL** stores the application data. **Visual Studio Code** is the development environment.

The application provides:

- A public catalogue with category and "nature" (everlasting / fresh) filters and search, plus a product detail page.
- A shopping cart that holds multiple items, persisted in the browser.
- A guided checkout that collects contact details, delivery address, delivery date and time slot and an optional gift message, then places the order.
- An order confirmation page and a tracking page where a customer can check order status using the order number and e-mail.
- A custom bouquet request form and a matching tracking page.
- Optional customer accounts that add order history and saved addresses.
- A minimal administrator panel: a dashboard with counts, product and category management, an orders list with status updates, custom-request handling and an enquiries list.

All money calculations and validation are performed on the server. The browser sends only product identifiers and quantities; the server re-prices every order from the database. Payment is not processed — an order is created with the status *pending* and is treated as pay-on-delivery.

## 3.3 Functional Requirements

**Table 3.1 – Functional requirements**

| # | Requirement |
|---|---|
| FR1 | The system shall display product categories and a list of active products with price and availability. |
| FR2 | The system shall allow customers to filter products by category and by nature (everlasting / fresh) and to search by name. |
| FR3 | The system shall show a product detail page with description, image, price, availability and lead time. |
| FR4 | The system shall allow customers to add products to a cart, change quantities and remove items. |
| FR5 | The system shall persist the cart in the browser between visits. |
| FR6 | The system shall provide a checkout that collects contact details, delivery address, delivery date and time slot, and an optional gift message. |
| FR7 | The system shall validate the delivery date against each product's nature and lead time. |
| FR8 | The system shall create an order, calculate the subtotal, delivery fee and total on the server, and generate a unique order number. |
| FR9 | The system shall show an order confirmation containing the order number and summary. |
| FR10 | The system shall allow a customer to track an order using the order number and e-mail. |
| FR11 | The system shall allow customers to submit a custom bouquet request describing occasion, palette, flowers, size, budget range and required date, with an optional inspiration image. |
| FR12 | The system shall allow a customer to track a custom request using its request number and e-mail. |
| FR13 | The system shall allow a customer to register and log in (optional), and shall then show order history, custom-request history and saved addresses. |
| FR14 | The system shall allow an administrator to log in securely. |
| FR15 | The system shall allow an administrator to create, edit and deactivate products and categories and to set product availability. |
| FR16 | The system shall allow an administrator to view orders, filter them by status and update the status of an order. |
| FR17 | The system shall allow an administrator to view custom requests, set their status and record a response and rough quote. |
| FR18 | The system shall allow an administrator to view enquiries and mark them as handled. |
| FR19 | The system shall provide an administrator dashboard showing counts of orders by status, new custom requests, unhandled enquiries and active products. |
| FR20 | The system shall store all product, customer, order and request data in the PostgreSQL database. |

## 3.4 Non-Functional Requirements

**Table 3.2 – Non-functional requirements**

| Attribute | Requirement |
|---|---|
| Usability | A customer shall be able to go from the home page to a placed order without instructions. |
| Performance | Catalogue and product pages shall respond within about 1.5 seconds on a normal connection; typical API calls within about 300 ms. |
| Reliability | An order and its items shall be written in a single database transaction so that a partial order can never be stored. |
| Security | Passwords shall be stored as BCrypt hashes; administrator routes shall require an administrator token; all input shall be validated on the server; database access shall use parameterized queries through EF Core. |
| Maintainability | The backend shall be layered (controller → service → repository) with typed DTOs; the frontend shall be organized by feature. |
| Responsiveness | The interface shall work correctly from a 360-pixel-wide phone screen up to a desktop display. |
| Data integrity | Foreign keys and enumerated constraints shall be enforced; order lines shall store a snapshot of product name and unit price. |
| Portability | The system shall run on Windows 10/11 with the .NET SDK, Node.js and a local PostgreSQL server. |

## 3.5 System Architecture

The application follows a **three-tier architecture**.

- **Presentation Layer** — Next.js (React, TypeScript). It renders the customer site and the administrator panel. Catalogue pages are rendered on the server for speed; the cart and forms run in the browser.
- **Application Layer** — ASP.NET Core Web API. It exposes a REST API under `/api/v1`, handles authentication with JWT tokens (separate customer and administrator audiences), validates all input, applies business rules such as delivery-date checks and order pricing, and communicates with the database.
- **Data Layer** — PostgreSQL, accessed through Entity Framework Core (Npgsql provider). It stores product, customer, order, custom-request and administrator data. Schema changes are applied as EF Core migrations, and a seed script loads demo data.

Separating the layers keeps presentation, business logic and storage independent, which makes the system easier to test, maintain and extend.

*Figure 3.1 – System architecture of Fleuréa Petals.*

The relationship between a product's nature and the rest of the system is shown in Figure 3.2: a single `nature` field on a product drives both the catalogue filter and the delivery-date rule at checkout.

*Figure 3.2 – Catalogue "two natures" logic.*

## 3.6 Database Design

PostgreSQL is used as the database. The design uses nine tables. The core chain runs from `categories` to `products` to `order_items` to `orders`, with `customers` on the far side. Two tables (`addresses`, `custom_requests`) relate to `customers`, and two (`admin_users`, `enquiries`) stand alone.

**Table 3.3 – Database tables and key columns**

| Table | Holds | Key columns |
|---|---|---|
| categories | Catalogue groupings | name, slug, sort_order, is_active |
| products | Bouquets and gifts for sale | name, slug, price, nature, availability, lead_time_days, is_customizable, is_active |
| customers | Guests and registered buyers | name, email, phone, password_hash (nullable), is_registered |
| addresses | Saved addresses (registered customers) | customer_id, recipient_name, phone, line1, line2, city, state, postal_code |
| orders | Placed orders with delivery snapshot | order_number, customer_id, status, subtotal, delivery_fee, total, recipient_name, address fields, delivery_date, delivery_slot, gift_message, placed_at |
| order_items | Line items within an order | order_id, product_id, product_name, unit_price, quantity, line_total |
| custom_requests | Custom bouquet enquiries | request_number, customer_id (nullable), contact fields, bouquet_type, occasion, palette, flowers_preferred, size, budget_min, budget_max, need_by_date, reference_notes, inspiration_image_url, status, admin_response, quoted_price |
| enquiries | Footer contact messages | name, email, message, is_handled, created_at |
| admin_users | Owner login (seeded: Forum Parmar / `forum`) | name, username, email, password_hash, last_login_at |

**Relationships**

- `categories` 1 — ∞ `products`
- `products` 1 — ∞ `order_items`
- `orders` 1 — ∞ `order_items`
- `customers` 1 — ∞ `orders`
- `customers` 1 — ∞ `addresses`
- `customers` 1 — 0..∞ `custom_requests` (a request may also be submitted without an account)

Each order line stores a **snapshot** of the product name and unit price, so that editing a product later never changes a historical order.

*Figure 3.3 – Entity–Relationship (ER) diagram.*

*Figure 3.4 – Database tables in PostgreSQL, shown in pgAdmin with sample data.*

**Database functions.** The tables are supported by a set of **PL/pgSQL functions** in the `public` schema. The API services call these functions instead of building SQL statements in C#, so that each read or write has a single, tested definition and the important rules — human-readable numbering, order pricing and the delivery-date checks — live in the database. The full definitions are in `database/functions.sql`; Table 3.4 lists them by purpose.

**Table 3.4 – Database functions used by the API**

| Function | Type | Purpose |
|---|---|---|
| `fn_get_categories()` | read | Active categories with a product count, ordered for display. |
| `fn_get_products(category, nature, search, page, page_size)` | read | Paged, filtered product list for the shop page. |
| `fn_get_product_by_slug(slug)` | read | Single active product for the detail page. |
| `fn_upsert_guest_customer(name, email, phone)` | insert | Reuse or create a guest customer row at checkout. |
| `fn_register_customer(name, email, phone, password_hash)` | insert | Create, or upgrade a guest to, a registered account. |
| `fn_place_order(contact, delivery, items jsonb)` | insert | Re-price each line from `products`, validate availability and the delivery date, then insert the order and its items together; returns the order row. |
| `fn_get_order(order_number, email)` | read | Order and its items for the tracking page (e-mail acts as an access check). |
| `fn_admin_list_orders(status)` | read | Order list for the admin panel, optionally filtered by status. |
| `fn_update_order_status(order_id, status)` | update | Move an order forward one stage, or to `cancelled` from an early stage. |
| `fn_create_custom_request(...)` | insert | Insert a custom bouquet request and issue its request number. |
| `fn_get_custom_request(request_number, email)` | read | Custom request for the tracking page. |
| `fn_respond_custom_request(id, status, response, quote)` | update | Record the administrator's response and rough quote and/or advance the status. |
| `fn_upsert_product(...)` | insert / update | Create a product (id is null) or update an existing one. |
| `fn_set_product_availability(id, availability)` | update | Quick availability toggle from the products list. |
| `fn_create_enquiry(name, email, message)` | insert | Store a footer contact-form message. |
| `fn_mark_enquiry_handled(id, handled)` | update | Mark an enquiry as handled. |
| `fn_dashboard_summary()` | read | Single-row counts for the admin dashboard cards. |
| `fn_next_order_number()` / `fn_next_request_number()` | helper | Format the next `FP-2026-000042` / `FP-CR-2026-000007` number from a sequence. |

*Figure 3.5 – Database functions in pgAdmin, showing the definition of `fn_place_order`.*

## 3.7 UML Diagrams

**Use-case diagram.** The actors are *Guest*, *Registered Customer* (a guest who has logged in) and *Administrator*. Guest use cases: browse catalogue, search, view product, add to cart, checkout, track order, submit custom request, submit enquiry, register / log in. Registered Customer additionally: view order history, view custom-request history, manage saved addresses. Administrator use cases: log in, view dashboard, manage products and categories, view and update orders, respond to custom requests, handle enquiries.

*Figure 3.6 – Use-case diagram.*

**Activity diagram – Place an order.** Browse catalogue → open product → add to cart → (repeat) → open cart → proceed to checkout → enter contact and delivery details → choose delivery date and slot → system validates date against product nature → review order → place order → system saves order and items in one transaction → confirmation shown with order number.

*Figure 3.7 – Activity diagram – Place an order.*

**Sequence diagram – Checkout.** Browser → Next.js frontend → `POST /api/v1/orders` → OrdersController → OrderService → `fn_place_order(...)` in PostgreSQL (re-prices items from the `products` table, validates, inserts the order and `order_items` in one transaction) → response with order number → confirmation page.

*Figure 3.8 – Sequence diagram – Checkout.*

**Class diagram.** Core domain classes: `Category`, `Product`, `Customer`, `Address`, `Order`, `OrderItem`, `CustomRequest`, `Enquiry`, `AdminUser`, with service classes `CatalogueService`, `OrderService`, `CustomRequestService`, `AuthService` and `AdminService`.

*Figure 3.9 – Class diagram.*

**State lifecycles.** Two entities move through states. An order: `pending → confirmed → in_preparation → ready → out_for_delivery → delivered`, with `cancelled` reachable by the administrator. A custom request: `new → reviewing → quoted → accepted → converted_to_order → closed`, or `quoted → declined → closed`.

*Figure 3.10 – Order status lifecycle.*
*Figure 3.11 – Custom request lifecycle.*

---

# CHAPTER 4: SYSTEM IMPLEMENTATION

## 4.1 Hardware Requirements

**Table 4.1 – Hardware requirements**

| Component | Minimum requirement |
|---|---|
| Processor | Intel Core i3 (or equivalent) and above |
| RAM | 4 GB or above (8 GB recommended for running frontend, backend and database together) |
| Storage | 256 GB HDD/SSD with space for project files, dependencies and the database |
| Display | 14-inch display or larger |
| Network | Wi-Fi or Ethernet connection for development and testing |
| Development machine | A computer or laptop able to run Node.js, the .NET SDK and PostgreSQL |

## 4.2 Software Requirements

**Table 4.2 – Software requirements**

| Category | Software |
|---|---|
| Operating system | Windows 10 / 11 |
| Frontend runtime | Node.js (LTS) with npm |
| Frontend framework | Next.js (React) with TypeScript |
| Styling | Tailwind CSS |
| Backend framework | ASP.NET Core Web API (.NET) |
| ORM | Entity Framework Core with the Npgsql provider |
| Database | PostgreSQL |
| Database tool | pgAdmin |
| IDE | Visual Studio Code |
| API testing | Swagger UI, and `.http` request files kept in the `tests/` folder (`tests/Fleurea.http`) run from VS Code or Visual Studio |
| Browser | Google Chrome or Microsoft Edge |
| Version control | Git and GitHub |

## 4.3 Technologies Used

**Table 4.3 – Technologies used**

| Technology | Purpose |
|---|---|
| Next.js (React) | Frontend framework — catalogue, cart, checkout, custom form and admin panel |
| TypeScript | Typed JavaScript for the frontend |
| Tailwind CSS | Styling and responsive layout; carries the Fleuréa palette and type from the existing site |
| react-hook-form + zod | Form handling and client-side validation |
| ASP.NET Core Web API | Backend REST API, business logic, authentication |
| Entity Framework Core (Npgsql) | Object–relational mapping and database migrations |
| FluentValidation | Server-side request validation |
| JWT bearer authentication | Customer and administrator sessions |
| BCrypt | Password hashing |
| PostgreSQL | Relational database for all application data |
| Swagger / OpenAPI | API documentation and manual testing |
| Visual Studio Code | Development environment for frontend and backend |
| Git & GitHub | Version control |

## 4.4 Module Description

**Table 4.4 – Module description**

| Module | Responsibility |
|---|---|
| Catalogue | Categories, product listing, category and nature filters, search, product detail page. |
| Cart | Add, update and remove items; browser persistence; re-validation of price and availability against the API. |
| Checkout & Order | Collect contact and delivery details; validate the delivery date; create the order and its items in one transaction; confirmation; guest order tracking. |
| Custom Request | Custom bouquet enquiry form with optional inspiration image; request tracking; request lifecycle. |
| Customer Account | Optional registration and login; order history; custom-request history; saved addresses. |
| Admin – Products | Product and category CRUD; availability toggle; image upload; activate / deactivate. |
| Admin – Orders | Order list with filtering; order detail; status transitions; dashboard counts. |
| Admin – Custom Requests | Review requests; record a response and rough quote; advance the status. |
| Enquiries | Footer contact form and an administrator list with a mark-as-handled action. |
| Authentication & Authorization | Issue and verify JWT tokens; separate customer and administrator audiences; password hashing. |
| Data Management | EF Core DbContext and migrations for the schema; the PL/pgSQL functions in `database/functions.sql` that the services call for every read and write; the demo seed data. |

## 4.5 User Interface Screens

The interface keeps the customer journey short: open the application, understand what Fleuréa Petals offers, browse bouquets and move to ordering without unnecessary steps. It re-uses the palette (Ivory, Blush, Rosewood, Sage, Gold Thread, Ink), the display typeface and the ribbon motif established on the existing Fleuréa page. The screens are:

- **Home** — introduces the two kinds of products (everlasting and fresh) and links to the shop. *Figure 4.1.*
- **Shop / catalogue** — product grid with category and nature filters and search. *Figure 4.2.*
- **Product detail** — image, description, price, availability, quantity selector and *Add to cart*; a link to request a custom version when the product is customizable. *Figure 4.3.*
- **Cart** — line items, quantity editing, removal, subtotal and estimated delivery fee. *Figure 4.4.*
- **Checkout** — contact details, delivery address, delivery date and slot, gift message and an order review. *Figure 4.5.*
- **Order confirmation** — order number and summary. *Figure 4.6.*
- **Track order** — order number and e-mail form, then a status timeline. *Figure 4.7.*
- **Custom bouquet request form** — occasion, palette, flowers, size, budget range, required date, notes and an optional image. *Figure 4.8.*
- **Custom request received** — request number and next steps. *Figure 4.9.*
- **Customer account – My Orders** — order history for a registered customer. *Figure 4.10.*
- **Admin – Dashboard** — counts of orders by status, new custom requests, unhandled enquiries and active products. *Figure 4.11.*
- **Admin – Product form** — create or edit a product, set availability, upload an image. *Figure 4.12.*
- **Admin – Orders list** — orders with status filter. *Figure 4.13.*
- **Admin – Order detail** — items, delivery details and a status control. *Figure 4.14.*
- **Admin – Custom request detail** — the request, with fields to record status, response and quote. *Figure 4.15.*

*Figure 4.1 – Home screen.*

*Figure 4.2 – Shop / catalogue screen.*

*Figure 4.3 – Product detail screen.*

*Figure 4.4 – Cart screen.*

*Figure 4.5 – Checkout screen.*

*Figure 4.6 – Order confirmation screen.*

*Figure 4.7 – Track order screen.*

*Figure 4.8 – Custom bouquet request form.*

*Figure 4.9 – Custom request received screen.*

*Figure 4.10 – Customer account, My Orders.*

*Figure 4.11 – Admin dashboard.*

*Figure 4.12 – Admin, product form.*

*Figure 4.13 – Admin, orders list.*

*Figure 4.14 – Admin, order detail.*

*Figure 4.15 – Admin, custom request detail.*

## 4.6 Sample Source Code

The snippets below are representative of the frontend, the backend and the database layer. They show the pattern used throughout the project rather than the complete implementation. The backend calls PostgreSQL functions (Section 3.6) rather than composing SQL in C#.

**Frontend – cart context (Next.js / React, `src/features/cart/CartContext.tsx`)**

```tsx
"use client";
import { createContext, useContext, useEffect, useState } from "react";

type CartLine = { productId: number; slug: string; name: string; price: number; quantity: number };
const CartContext = createContext<{
  lines: CartLine[];
  add: (line: CartLine) => void;
  setQty: (productId: number, quantity: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
} | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("fleurea-cart");
      if (saved) setLines(JSON.parse(saved));
    } catch { /* ignore unavailable storage */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem("fleurea-cart", JSON.stringify(lines)); } catch {}
  }, [lines]);

  const add = (line: CartLine) =>
    setLines((cur) => {
      const found = cur.find((l) => l.productId === line.productId);
      return found
        ? cur.map((l) => (l.productId === line.productId ? { ...l, quantity: l.quantity + line.quantity } : l))
        : [...cur, line];
    });
  const setQty = (productId: number, quantity: number) =>
    setLines((cur) => cur.map((l) => (l.productId === productId ? { ...l, quantity } : l)));
  const remove = (productId: number) => setLines((cur) => cur.filter((l) => l.productId !== productId));
  const clear = () => setLines([]);

  return <CartContext.Provider value={{ lines, add, setQty, remove, clear }}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
```

**Backend – place order (ASP.NET Core, `Controllers/OrdersController.cs` and `Services/OrderService.cs`)**

```csharp
[ApiController]
[Route("api/v1/orders")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orders;
    public OrdersController(IOrderService orders) => _orders = orders;

    [HttpPost]
    public async Task<ActionResult<OrderConfirmationDto>> Place([FromBody] PlaceOrderRequest request)
    {
        var result = await _orders.CreateAsync(request);
        return CreatedAtAction(nameof(Track), new { orderNumber = result.OrderNumber }, result);
    }

    [HttpGet("{orderNumber}")]
    public async Task<ActionResult<OrderStatusDto>> Track(string orderNumber, [FromQuery] string email)
        => await _orders.GetForCustomerAsync(orderNumber, email) is { } dto ? Ok(dto) : NotFound();
}

public class OrderService : IOrderService
{
    private readonly AppDbContext _db;
    public OrderService(AppDbContext db) => _db = db;

    public async Task<OrderConfirmationDto> CreateAsync(PlaceOrderRequest r)
    {
        // The database function re-prices every line from the products table,
        // validates availability and the delivery date, and inserts the order
        // and its items in one transaction. The browser's prices are ignored.
        var items = JsonSerializer.Serialize(
            r.Items.Select(i => new { product_id = i.ProductId, quantity = i.Quantity }));

        var order = await _db.Orders
            .FromSqlInterpolated($@"
                SELECT * FROM fn_place_order(
                    {r.Contact.Name}, {r.Contact.Email}, {r.Contact.Phone},
                    {r.Delivery.RecipientName}, {r.Delivery.Phone},
                    {r.Delivery.Line1}, {r.Delivery.Line2}, {r.Delivery.City}, {r.Delivery.State},
                    {r.Delivery.PostalCode}, {r.Delivery.Landmark},
                    {r.Delivery.Date}, {r.Delivery.Slot},
                    {r.GiftMessage}, {r.CustomerNote}, {items}::jsonb)")
            .AsNoTracking()
            .SingleAsync();

        return new OrderConfirmationDto(order.OrderNumber, order.Total, order.Status.ToString());
    }
}
```

**Database – the `fn_place_order` function (PL/pgSQL, `database/functions.sql`)**

```sql
CREATE OR REPLACE FUNCTION fn_place_order(
    p_contact_name text, p_contact_email text, p_contact_phone text,
    p_recipient_name text, p_recipient_phone text,
    p_line1 text, p_line2 text, p_city text, p_state text,
    p_postal_code text, p_landmark text,
    p_delivery_date date, p_delivery_slot text,
    p_gift_message text, p_customer_note text,
    p_items jsonb                       -- [{"product_id":1,"quantity":2}, ...]
) RETURNS orders AS $$
DECLARE
    v_customer_id  int;
    v_order        orders;
    v_item         jsonb;
    v_product      products;
    v_qty          int;
    v_delivery_fee numeric(10,2) := 80.00;
    v_free_over    numeric(10,2) := 1500.00;
BEGIN
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'EMPTY_ORDER';
    END IF;

    v_customer_id := fn_upsert_guest_customer(p_contact_name, p_contact_email, p_contact_phone);

    INSERT INTO orders (order_number, customer_id, status, recipient_name, recipient_phone,
        address_line1, address_line2, city, state, postal_code, landmark,
        delivery_date, delivery_slot, gift_message, customer_note)
    VALUES (fn_next_order_number(), v_customer_id, 'pending', p_recipient_name, p_recipient_phone,
        p_line1, coalesce(p_line2,''), p_city, coalesce(p_state,'Maharashtra'),
        p_postal_code, coalesce(p_landmark,''),
        p_delivery_date, p_delivery_slot::delivery_slot, p_gift_message, p_customer_note)
    RETURNING * INTO v_order;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_qty := greatest((v_item->>'quantity')::int, 1);

        SELECT * INTO v_product FROM products
        WHERE  id = (v_item->>'product_id')::int AND is_active;

        IF NOT FOUND THEN RAISE EXCEPTION 'PRODUCT_NOT_FOUND: %', v_item->>'product_id'; END IF;
        IF v_product.availability = 'sold_out' THEN
            RAISE EXCEPTION 'PRODUCT_SOLD_OUT: %', v_product.name; END IF;
        IF v_product.nature = 'everlasting'
           AND p_delivery_date < current_date + v_product.lead_time_days THEN
            RAISE EXCEPTION 'DELIVERY_TOO_SOON: % needs % day(s)', v_product.name, v_product.lead_time_days;
        END IF;

        INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
        VALUES (v_order.id, v_product.id, v_product.name, v_product.price, v_qty, v_product.price * v_qty);
    END LOOP;

    -- totals computed here, from the rows just inserted
    UPDATE orders o
       SET subtotal     = s.subtotal,
           delivery_fee = CASE WHEN s.subtotal >= v_free_over THEN 0 ELSE v_delivery_fee END,
           total        = s.subtotal + CASE WHEN s.subtotal >= v_free_over THEN 0 ELSE v_delivery_fee END
      FROM (SELECT sum(line_total) AS subtotal FROM order_items WHERE order_id = v_order.id) s
     WHERE o.id = v_order.id
    RETURNING o.* INTO v_order;

    RETURN v_order;
END;
$$ LANGUAGE plpgsql;
```

**Database – the read function behind `GET /products` (`database/functions.sql`)**

```sql
CREATE OR REPLACE FUNCTION fn_get_products(
    p_category text DEFAULT NULL, p_nature text DEFAULT NULL, p_search text DEFAULT NULL,
    p_page int DEFAULT 1, p_page_size int DEFAULT 12
)
RETURNS TABLE (id int, name text, slug text, short_description text, price numeric,
    nature product_nature, availability product_availability, lead_time_days int,
    image_url text, category text, total_count bigint)
AS $$
    SELECT p.id, p.name, p.slug, p.short_description, p.price,
           p.nature, p.availability, p.lead_time_days, p.image_url,
           c.name AS category, count(*) OVER() AS total_count
    FROM   products p
    JOIN   categories c ON c.id = p.category_id
    WHERE  p.is_active
      AND (p_category IS NULL OR c.slug = p_category)
      AND (p_nature   IS NULL OR p.nature = p_nature::product_nature)
      AND (p_search   IS NULL OR p.name ILIKE '%' || p_search || '%')
    ORDER  BY c.sort_order, p.name
    LIMIT  greatest(p_page_size, 1)
    OFFSET greatest(p_page - 1, 0) * greatest(p_page_size, 1);
$$ LANGUAGE sql STABLE;
```

---

# CHAPTER 5: TESTING AND RESULTS

Testing was carried out screen by screen and then across the complete ordering flow. A page-by-page test catalogue was prepared (`tests/test-cases.md`): for every screen it records the on-load checks, each click and input with its expected behaviour, and every API call the page makes — tested with valid input, invalid input, empty input, and (for protected endpoints) a missing, wrong or wrong-audience token, plus the business-rule failures such as a sold-out product, a delivery date that is too soon, a tampered price and an invalid status transition. In total this covers 18 screens with roughly 75 on-load checks, 110 interaction cases and 130 API cases. The HTTP requests are kept in `tests/Fleurea.http` and were run from the VS Code REST Client and Swagger; database writes were verified in pgAdmin.

Table 5.1 is the summary pass for the main flows; Table 5.2 maps the functional requirements to the tests that verify them.

## 5.1 Test Cases

Table 5.1 lists the main functional test cases (T1–T25) that were run through the user interface and
confirmed against the database. The complete page-by-page catalogue — on-load checks, interactions
and the full set of API cases (valid, invalid, empty, wrong / missing token, not-found and
business-rule failures) — is in `tests/test-cases.md`.

**Table 5.1 – Functional test cases and results**

| # | Scenario | Steps | Expected result | Result |
|---|---|---|---|---|
| T1 | Home loads | Open `/` | Landing page renders with a link to the shop | Pass |
| T2 | Browse catalogue | Open `/shop` | Active products shown with price and availability | Pass |
| T3 | Filter by nature | Select "Fresh" | Only fresh products are listed | Pass |
| T4 | Search | Type "ribbon" | Only matching products are listed | Pass |
| T5 | Product detail | Open a product | Description, price, image and availability are shown | Pass |
| T6 | Add to cart | Add a product, quantity 2 | Cart count is 2 and subtotal is correct | Pass |
| T7 | Update cart | Change quantity, remove an item | Totals recalculate | Pass |
| T8 | Checkout validation | Submit an empty checkout form | Field errors are shown; no order is created | Pass |
| T9 | Place order (guest) | Fill valid details and place the order | Order is saved, an order number is shown, the cart is cleared | Pass |
| T10 | Server re-pricing | Tamper with the client price and place the order | The order total uses the database price, not the client value | Pass |
| T11 | Delivery-date rule | Choose a date sooner than an everlasting product's lead time | The date is rejected with a message | Pass |
| T12 | Track order | Enter order number and e-mail on `/track` | The correct status timeline is shown | Pass |
| T13 | Track order – wrong e-mail | Enter a mismatched e-mail | Access is denied / not found | Pass |
| T14 | Custom request | Submit the custom bouquet form | The request is saved and a request number is shown | Pass |
| T15 | Custom request tracking | Track the new request | Status is shown as "new" | Pass |
| T16 | Enquiry form | Submit the footer enquiry form | The enquiry is stored and visible to the administrator | Pass |
| T17 | Register and log in | Create an account and log in | A session is created and `/account` is accessible | Pass |
| T18 | Order history | A logged-in customer places an order | The order appears in `/account` | Pass |
| T19 | Admin login | Enter valid, then invalid credentials | Access is granted, then denied | Pass |
| T20 | Admin add product | Create a product with an image | The product appears in `/shop` | Pass |
| T21 | Admin availability | Set a product to "sold out" | The catalogue shows the badge and disables "Add to cart" | Pass |
| T22 | Admin order status | Move an order pending → confirmed → delivered | Customer tracking reflects each change | Pass |
| T23 | Admin custom request | Set status "quoted" with a response and price | Customer tracking shows the quote | Pass |
| T24 | Database persistence | Restart the API and query the order again | The data is still present in PostgreSQL | Pass |
| T25 | Responsive layout | Open the site at 360 px width | The layout is usable with no horizontal scrolling | Pass |

*Figure 5.1 – Test execution summary.*

**Requirements traceability.** Table 5.2 maps each functional requirement (FR1–FR20, §3.3) to the
test cases that exercise it, so that no requirement is left unverified.

**Table 5.2 – Requirements traceability (FR → test)**

| Requirement | Verified by |
|---|---|
| FR1 – Show categories and active products | T2, N1 |
| FR2 – Filter by category / nature and search | T3, T4, N1 |
| FR3 – Product detail page | T5, N2 |
| FR4 – Add / update / remove cart items | T6, T7 |
| FR5 – Cart persists between visits | T6, T7 (cart reloaded after refresh) |
| FR6 – Checkout collects contact + delivery details | T8, T9, N6 |
| FR7 – Validate the delivery date against nature / lead time | T11, N4 |
| FR8 – Create order, price on the server, generate order number | T9, T10, N3, N5 |
| FR9 – Order confirmation with number and summary | T9 |
| FR10 – Track an order by number + e-mail | T12, T13, N7 |
| FR11 – Submit a custom bouquet request | T14, N13 |
| FR12 – Track a custom request | T15 |
| FR13 – Register / log in; order and request history | T17, T18, N8 |
| FR14 – Administrator login | T19, N9, N10 |
| FR15 – Manage products / categories / availability | T20, T21, N3 |
| FR16 – View and update order status | T22, N11, N12 |
| FR17 – Respond to a custom request with status + quote | T23 |
| FR18 – View enquiries and mark handled | T16 |
| FR19 – Administrator dashboard counts | Visual check on the dashboard screen + `GET /admin/dashboard/summary` |
| FR20 – Store all data in PostgreSQL | T9, T14, T24 |

## 5.2 Results and Outputs

The result of the project is a working web application that connects the customer interface with the backend API and the PostgreSQL database. A customer can browse Fleuréa Petals' products, build a cart and place an order through a single guided checkout, and can later track that order by its number. Custom bouquet requests are captured with all the details the business needs to prepare a quote. The administrator panel gives the business one place to manage products, move orders through their fulfilment stages and respond to custom requests.

The most important outcome is that the ordering process is now clearer and more organized than relying on informal chat messages: every order has a number, a status and a permanent record. Server-side re-pricing and validation make the stored data trustworthy. The custom-request flow keeps the personalized, handmade character of Fleuréa Petals while still giving it structure.

Screenshots of the running application are included in Section 4.5 and the Appendix.

---

# CHAPTER 6: CONCLUSION AND FUTURE SCOPE

## 6.1 Conclusion

Fleuréa Petals – Flower Bouquet Ordering Application was developed as a field project based on the real needs of a small handmade flower business. It connects a business requirement with software development by providing a digital platform for showcasing bouquets, placing orders through a cart and checkout, submitting custom bouquet requests, and managing everything from a small administrator panel.

The project shows how a focused web application can help a small business organize its customer interaction and present its products, without the cost and complexity of a large commercial platform. Next.js, ASP.NET Core and PostgreSQL provide the technical foundation, and Visual Studio Code was used for development. The three-tier design keeps the presentation, logic and data concerns separate, and the decision to keep all pricing and validation on the server keeps the stored data reliable.

The project also reinforced that technology should solve a real problem rather than add complexity. For Fleuréa Petals, the focus was on making ordering convenient while keeping the personal and creative nature of handmade gifting.

## 6.2 Learning Outcomes

- Converting a real business requirement into a structured software project with a defined scope.
- Designing a relational database, drawing an ER diagram and applying schema changes through EF Core migrations.
- Building a REST API with ASP.NET Core using a layered controller–service–repository structure.
- Building a modern frontend with Next.js and React, including client-side state (the cart) and form validation.
- Understanding how a frontend and backend communicate over HTTP and why validation and pricing must live on the server.
- Implementing authentication with hashed passwords and JWT tokens for two different audiences.
- Writing and executing test cases, and debugging issues found during testing.
- Improving documentation, planning and project-presentation skills.

## 6.3 Future Scope

- **Online payment** — integrate a payment gateway so customers can pay when ordering.
- **Order-status notifications** — send e-mail or SMS updates at each status change.
- **Richer customer accounts** — order re-ordering, wishlists and stored preferences.
- **Admin analytics** — charts of popular products, demand by season and order volumes.
- **Delivery management** — delivery-area checks, delivery-slot capacity and a driver view.
- **Reviews and ratings** — let customers leave feedback on delivered orders.
- **Inventory** — track stock of ribbon, wire and fresh stems, and warn when low.
- **Convert custom requests to orders automatically** — once a quote is accepted.
- **Catalogue growth** — seasonal collections and additional gift pairings.
- **Cloud deployment** — host the application so it is reachable from anywhere.

---

# CHAPTER 7: REFERENCES

The following sources were used during the design and development of the project. References are given in APA style.

1. Meta Platforms, Inc. (n.d.). *React documentation*. Retrieved 2026, from https://react.dev/
2. Vercel, Inc. (n.d.). *Next.js documentation*. Retrieved 2026, from https://nextjs.org/docs
3. Microsoft. (n.d.). *ASP.NET Core documentation*. Retrieved 2026, from https://learn.microsoft.com/aspnet/core
4. Microsoft. (n.d.). *Entity Framework Core documentation*. Retrieved 2026, from https://learn.microsoft.com/ef/core
5. The PostgreSQL Global Development Group. (n.d.). *PostgreSQL 16 documentation*. Retrieved 2026, from https://www.postgresql.org/docs/
6. Tailwind Labs. (n.d.). *Tailwind CSS documentation*. Retrieved 2026, from https://tailwindcss.com/docs
7. Mozilla. (n.d.). *MDN Web Docs: HTML, CSS, JavaScript and HTTP*. Retrieved 2026, from https://developer.mozilla.org/
8. Microsoft. (n.d.). *Visual Studio Code documentation*. Retrieved 2026, from https://code.visualstudio.com/docs
9. npgsql.org. (n.d.). *Npgsql – .NET data provider for PostgreSQL*. Retrieved 2026, from https://www.npgsql.org/

Any additional sources consulted during development should be added here in the same APA style.

---

# CHAPTER 8: APPENDIX

## 8.1 User Manual

**Placing an order**

1. Open the Fleuréa Petals application in a web browser.
2. Open **Shop** and browse the bouquets and gifts. Use the category and "everlasting / fresh" filters or the search box to narrow the list.
3. Open a product to see its description, price and availability.
4. Choose a quantity and select **Add to cart**. Repeat for other products.
5. Open the **Cart**, check the items and quantities, then select **Checkout**.
6. Enter your contact details and the delivery address.
7. Choose a delivery date and time slot. The application will not allow a date that is too soon for the items in your cart.
8. Add an optional gift message, review the order and select **Place order**.
9. Note the **order number** shown on the confirmation screen.
10. To check progress later, open **Track order** and enter the order number and the e-mail you used.

**Requesting a custom bouquet**

1. Open **Custom** from the menu.
2. Describe the bouquet: occasion, colours, preferred flowers, size and budget range.
3. Enter the date you need it by and any reference notes; attach an inspiration image if you have one.
4. Submit the request and note the **request number**.
5. The business will review the request and respond with a rough quote, which you can see on the tracking page.

**Administrator**

1. Open **/admin** and log in.
2. The dashboard shows counts of orders by status, new custom requests, unhandled enquiries and active products.
3. Use **Products** to add or edit products, set availability and upload images.
4. Use **Orders** to view orders, filter by status and move an order to its next stage.
5. Use **Custom requests** to read a request and record a status, response and quote.

## 8.2 Additional Screenshots

Screenshots of all customer and administrator screens are included as Figures 4.1 to 4.15. Additional screenshots (empty cart, validation errors, sold-out product, order status timeline) may be added here.

## 8.3 Code Snippets

Representative code is shown in Section 4.6: a Next.js cart context, the ASP.NET Core controller and order service that call the database function, and the `fn_place_order` and `fn_get_products` PL/pgSQL functions. The complete schema is in `database/schema.sql`, all functions in `database/functions.sql`, and the demo data in `database/seed.sql`.

## 8.4 Weekly Activity Log

**Table 8.1 – Weekly activity log**

| Week | Activity performed | Outcome |
|---|---|---|
| 1 | Project discussion and requirement gathering | Project title and four objectives finalized; requirements identified |
| 2 | Study of the existing system and problem identification | Existing ordering process studied; problems documented |
| 3 | Software requirement analysis | Functional and non-functional requirements prepared |
| 4 | Database design (ER diagram) | Nine-table schema designed; EF Core entities and first migration created |
| 5 | UI design (wireframes / mockups) | Screen layouts and customer flow prepared; design tokens taken from the existing site |
| 6 | Module 1 development – Catalogue | Categories and products API with seed data; home, shop and product pages |
| 7 | Module 2 development – Cart and Order | Cart, checkout, order creation, confirmation and tracking; custom-request module started |
| 8 | Database integration | Frontend connected to the API end to end; migrations and seed finished; admin panel built |
| 9 | Testing of modules | Test cases executed; bugs identified and fixed |
| 10 | User interface improvements | Full visual design applied; responsive pass; empty / error / loading states |
| 11 | Final testing and documentation | Regression testing; screenshots captured; report chapters written |
| 12 | Project demonstration and submission | Demo data seeded; run-through rehearsed; final report prepared |
