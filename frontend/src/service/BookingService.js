import {myAxios, privateAxios} from "../config/cloud";

export const CalculateTotalAmount = (roomId, userId, fromDate, toDate) => {
    console.log(fromDate);
    return privateAxios
        .post(`${roomId}/booking/${userId}`,
            {
                startDate: fromDate,
                endDate: toDate
            })
        .then(response => response.data);
}

export const BookRoom = (userId, roomId, days, amount, fromDate, toDate) => {
    console.log(userId, roomId, days, amount);
    return myAxios.post('/room-payment',
        {
            userId: userId,
            roomId: roomId,
            days: days,
            total_amount: amount,
            startDate: fromDate,
            endDate: toDate
        })
        .then(response => response.data);
}