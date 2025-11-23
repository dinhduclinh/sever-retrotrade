function buildAddress(body, currentAddress) {
    // Nếu không có ít nhất 1 trường địa chỉ mới, trả về địa chỉ cũ
    if (
        !body.street && !body.ward && !body.district && !body.province &&
        !body.fullName && !body.phone
    ) {
        return currentAddress;
    }
    // Ngược lại, xây object mới
    return {
        fullName: body.fullName ?? currentAddress?.fullName,
        phone: body.phone ?? currentAddress?.phone,
        street: body.street ?? currentAddress?.street,
        ward: body.ward ?? currentAddress?.ward,
        district: body.district ?? currentAddress?.district,
        province: body.province ?? currentAddress?.province,
        isDefault: true
    };
}

module.exports = buildAddress;