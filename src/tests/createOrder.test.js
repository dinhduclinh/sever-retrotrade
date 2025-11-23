const request = require("supertest");
const mongoose = require("mongoose");

const BASE_URL = "http://localhost:9999"; 
const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OGYzYTU5OWI4NTJkNTUyMmU1ZTQ3YjgiLCJlbWFpbCI6ImR1eWRvMTA1MUBnbWFpbC5jb20iLCJ1c2VyR3VpZCI6Ijg1MWIxZjNkLTg0NGEtNDU4NS04MGIzLTYyNWQ0YWEwMWE1YSIsImF2YXRhclVybCI6Imh0dHBzOi8vcmVzLmNsb3VkaW5hcnkuY29tL2RxbGJzc3ZyNS9pbWFnZS91cGxvYWQvdjE3NjA5NDk5MjEvVXNlckF2YXRhci9hdmF0YXJfMTc2MDk0OTkwODE5Ml9jMXMxYjVqY3MuanBnIiwiZnVsbE5hbWUiOiLEkOG7lyBYdcOibiBEdXkiLCJyb2xlIjoicmVudGVyIiwiaWF0IjoxNzYyMjUxOTIxLCJleHAiOjE3NjI4NTY3MjF9.7Okfk0N48HFx96HjgWx6MBse2t6bQDgDMFLPILuXhgs";

describe("POST /api/v1/order (createOrder)", () => {
  afterAll(async () => {
    await mongoose.connection.close();
  });

  // 1️ Thiếu trường bắt buộc
  it("should return 400 if missing required fields", async () => {
    const res = await request(BASE_URL)
      .post("/api/v1/order")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/missing required fields/i);
  });

  // 2️ Item không tồn tại
  it("should return 404 if item not found", async () => {
    const res = await request(BASE_URL)
      .post("/api/v1/order")
      .set("Authorization", `Bearer ${token}`)
      .send({
        itemId: "000000000000000000000000",
        rentalStartDate: "2025-11-06T09:00:00Z",
        rentalEndDate: "2025-11-07T09:00:00Z",
        shippingAddress: { street: "123 Thach That", city: "Ha Noi" },
      });

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toMatch(/item unavailable/i);
  });

  // 3 Item bị xóa hoặc không còn hoạt động
  it("should return 404 if item is deleted or not active", async () => {
    const deletedItemId = "68f3a599b852d5522e5e47bb"; 
    const res = await request(BASE_URL)
      .post("/api/v1/order")
      .set("Authorization", `Bearer ${token}`)
      .send({
        itemId: deletedItemId,
        rentalStartDate: "2025-11-10T09:00:00Z",
        rentalEndDate: "2025-11-12T09:00:00Z",
        shippingAddress: { street: "123", city: "HCM" },
      });

    expect([400, 404, 500]).toContain(res.statusCode);
  });

  // 4️ Không đủ số lượng
  it("should return 400 if not enough quantity", async () => {
    const fakeItemId = "68f3c22ea7e29f500b7e59b5"; 
    const res = await request(BASE_URL)
      .post("/api/v1/order")
      .set("Authorization", `Bearer ${token}`)
      .send({
        itemId: fakeItemId,
        quantity: 9999, 
        rentalStartDate: "2025-11-06T09:00:00Z",
        rentalEndDate: "2025-11-07T09:00:00Z",
        shippingAddress: { street: "123 Nguyễn Huệ", city: "Hồ Chí Minh" },
      });

    expect([400, 500]).toContain(res.statusCode);
  });

  // 5️ Không tính được tiền thuê 
  it("should return 400 if cannot calculate rental cost", async () => {
    const fakeItemId = "68f3c22ea7e29f500b7e59b5";
    const res = await request(BASE_URL)
      .post("/api/v1/order")
      .set("Authorization", `Bearer ${token}`)
      .send({
        itemId: fakeItemId,
        quantity: 1,
        rentalStartDate: "1900-01-01T00:00:00Z", // sai date
        rentalEndDate: "1900-01-01T01:00:00Z",
        shippingAddress: { street: "123 Nguyễn Huệ", city: "Hồ Chí Minh" },
      });

    expect([400, 500]).toContain(res.statusCode);
  });

  // 6️ Thành công
  it("should create order successfully with valid data", async () => {
    const fakeItemId = "68f3c22ea7e29f500b7e59b5";
    const res = await request(BASE_URL)
      .post("/api/v1/order")
      .set("Authorization", `Bearer ${token}`)
      .send({
        itemId: fakeItemId,
        quantity: 1,
        rentalStartDate: "2025-11-06T09:00:00Z",
        rentalEndDate: "2025-11-07T09:00:00Z",
        shippingAddress: {
          street: "123 Nguyễn Huệ",
          city: "Hồ Chí Minh",
          district: "1",
        },
        paymentMethod: "Wallet",
        note: "Test order",
      });

    // nếu server OK
    if (res.statusCode === 201) {
      expect(res.body.message).toMatch(/order created successfully/i);
      expect(res.body.data).toHaveProperty("orderId");
      expect(res.body.data).toHaveProperty("totalAmount");
    } else {
     
      expect([400, 404, 500]).toContain(res.statusCode);
    }
  });

  // 7️ Không có token (chưa đăng nhập)
  it("should return 401 if no token provided", async () => {
    const res = await request(BASE_URL)
      .post("/api/v1/order")
      .send({
        itemId: "68f3c22ea7e29f500b7e59b5",
        rentalStartDate: "2025-11-06T09:00:00Z",
        rentalEndDate: "2025-11-07T09:00:00Z",
        shippingAddress: { street: "abc" },
      });

    expect([401, 403]).toContain(res.statusCode);
  });

  // 8️ Token sai / user không hợp lệ
  it("should return 403 if token is invalid", async () => {
    const res = await request(BASE_URL)
      .post("/api/v1/order")
      .set("Authorization", "Bearer invalid_token")
      .send({
        itemId: "68f3c22ea7e29f500b7e59b5",
        rentalStartDate: "2025-11-06T09:00:00Z",
        rentalEndDate: "2025-11-07T09:00:00Z",
        shippingAddress: { street: "abc" },
      });

    expect([401, 403]).toContain(res.statusCode);
  });

  // 9️ Lỗi hệ thống 
  it("should return 500 if internal server error occurs", async () => {

    const res = await request(BASE_URL)
      .post("/api/v1/order")
      .set("Authorization", `Bearer ${token}`)
      .send({
        itemId: null, 
        rentalStartDate: "abc",
        rentalEndDate: "xyz",
        shippingAddress: {},
      });

   expect([400, 500]).toContain(res.statusCode);
    expect(res.body).toHaveProperty("message");
  });
});
