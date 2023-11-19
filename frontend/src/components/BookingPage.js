import Base from "./Base";
import {useParams} from "react-router-dom";
import React, {useEffect, useState} from "react";
import {BookRoom, CalculateTotalAmount} from "../service/BookingService";
import {Alert, Tooltip} from "@mui/material";
import Container from "@mui/material/Container";
import {Card, Col, Form, FormGroup, Input, Row} from "reactstrap";
import Button from "@mui/material/Button";
import easypaisa from "../img/easypaisa.png";
import jasscash from "../img/Jazz-cash.jpg";
import styled from "styled-components";
import {getUserDetail} from "../service/userservice";
import "../style/DatePicker.css";
import {getRoomDates, getRoomReservedDates} from "../service/roomsservice";

const RoomCreds = styled.p`
  padding: 12px;
  color: #666;
  border-radius: 1rem;
  transition: 0.5s ease;

  &:hover {
    background: #f3f4f7;
    cursor: pointer;
  }
`;

const PaymentNumber = styled.label`
  color: #0F172B;
  font-weight: bold;
`;

const Dates = styled.div`
  color: wheat;
  font-family: Calibri;
  font-weight: bold;
  background-color: #0077c8;
  padding: 2px 8px;
  border-radius: 8px;
  width: 60px;
  margin-bottom: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
`

export const BookingPage = () => {
    const {roomId} = useParams();
    const [userId, setUserId] = useState();
    const [paymentDetail, setPaymentDetail] = useState('');
    const [roomDates, setRoomDates] = useState([]);
    const [available, setAvailable] = useState(false);
    const [dateError, setDateError] = useState(false);
    const [isRoomBook, setIsRoomBook] = useState(false);
    const [error, setError] = useState(false);
    const [dateRangeError, setDateRangeError] = useState(false);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [listOfDates, setListOfDates] = useState([]);


    const handleRate = () => {

        if (!fromDate && !toDate) {
            if (new Date(fromDate) > new Date(toDate)) {
                alert('Oh no! From date cannot be greater than To date. Please select valid dates.');
            } else {
                setDateError(true);
                setTimeout(() => {
                    setDateError(false);
                }, 4000);
            }
        } else {
            CalculateTotalAmount(roomId, userId, fromDate, toDate)
                .then(response => {
                    if (response.status === true) {
                        setPaymentDetail(response.data);
                    } else {
                        setDateRangeError(true);
                        setTimeout(() => {
                            setDateRangeError(false);
                        }, 4000);
                    }
                }).catch((error) => {
                console.log(error);
            })
        }
    }

    const handleBooking = () => {
        if (fromDate === '' || toDate === '') {
            setError(true);
            window.scroll(0, 0);
            setTimeout(() => {
                setError(false);
            }, 8000);
            return;
        }
        BookRoom(userId, roomId, paymentDetail.days, paymentDetail.discounted_amount, fromDate, toDate)
            .then(response => {
                setIsRoomBook(true);
                setTimeout(() => {
                    setIsRoomBook(false);
                }, 8000);

            }).catch((error) => {
            console.log(error);
        })

    }

    const handleFromDate = (e) => {
        setFromDate(e.target.value.toString());
    }

    const handleToDate = (e) => {
        setToDate(e.target.value.toString());
    }

    useEffect(() => {

        getRoomDates(roomId)
            .then((response) => {
                setListOfDates(response);
            }).catch((error) => {
            console.log(error);
        })

        setUserId(getUserDetail().data.userId);
        getRoomReservedDates(roomId)
            .then((response) => {
                setRoomDates(response);
                if (response.status === false) {
                    setAvailable(true);
                }
            }).catch((error) => {
            console.log(error);
        })
    }, []);

    return (
        <Base>
            <Container style={{
                marginBottom: '80px'
            }}>
                {/*{JSON.stringify(userId)}*/}
                {/*{JSON.stringify(paymentDetail)}*/}
                <Row className="d-flex justify-content-center align-content-center">
                    <Col lg={8}>
                        <Card className="mt-5 p-5">
                            {/*{JSON.stringify(fromDate)}*/}
                            {/*{JSON.stringify(toDate)}*/}
                            {isRoomBook &&
                                <Alert style={{marginBottom: '20px'}}
                                       severity="success"
                                       sx={{transition: 'opacity 0.5s', opacity: 1}}
                                >
                                    Room is booked successfully!
                                </Alert>
                            }
                            {error &&
                                <Alert style={{marginBottom: '20px'}}
                                       severity="error"
                                       sx={{transition: 'opacity 0.5s', opacity: 1}}
                                >
                                    Please select the date and calculate the rate!
                                </Alert>
                            }
                            {dateRangeError &&
                                <Alert style={{marginBottom: '20px'}}
                                       severity="error"
                                       sx={{transition: 'opacity 0.5s', opacity: 1}}
                                >
                                    Start date is greater from end date!
                                </Alert>
                            }
                            {dateError &&
                                <Alert className="mb-2" severity="error">Select the date!</Alert>
                            }

                            <Form style={{textAlign: "left"}}>
                                {!available && (
                                    <>
                                        <p>This room is booked
                                            from <b>{roomDates?.oldest_date}</b> till <b>{roomDates?.latest_date}</b>
                                        </p>
                                        <p><b style={{color: 'red'}}>Note: </b>Please choose another dated for booking
                                        </p>
                                    </>
                                )}
                                <Row>
                                    <Col xl={6} lg={6} md={6} sm={12} xs={12}>
                                        <FormGroup>
                                            <Input type="date"
                                                   className="custom-date-input"
                                                   value={fromDate}
                                                   onChange={handleFromDate}
                                                   required
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col xl={6} lg={6} md={6} sm={12} xs={12}>
                                        <FormGroup>
                                            <Input type="date"
                                                   className="custom-date-input"
                                                   value={toDate}
                                                   onChange={handleToDate}
                                                   required
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col className="mt-1">
                                        <Button variant="outlined"
                                                onClick={handleRate}>Calculate</Button>
                                    </Col>
                                </Row>
                                <Row className="mt-3 mb-3">
                                    <Col xl={6} lg={6} md={6} sm={12} xs={12}>
                                        <RoomCreds>
                                            <h6>Rent: {paymentDetail.rent}</h6>
                                            <h6>Days: {paymentDetail.numberOfDays}</h6>
                                            <h6>Discount: {paymentDetail.discount}</h6>
                                            <hr/>
                                            <h6>Total Amount: {paymentDetail.discounted_amount}</h6>
                                        </RoomCreds>
                                    </Col>
                                    <Col xl={6} lg={6} md={6} sm={12} xs={12}>
                                        <img src={easypaisa} width={40}/>
                                        <img src={jasscash} width={100}/>
                                        <Tooltip placement="top" title="Pay on this number">
                                            <PaymentNumber>0324-4165643</PaymentNumber>
                                        </Tooltip>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col>
                                        <Button style={{backgroundColor: '#5272F2'}} variant="contained"
                                                onClick={handleBooking}>Book now</Button>
                                    </Col>
                                </Row>
                                <Row>
                                </Row>
                            </Form>
                        </Card>
                    </Col>
                    <Col>
                        <Card className="mt-5 p-2">
                            <h6>This room is not available in these dates</h6>
                            {/*{JSON.stringify(listOfDates)}*/}
                            {listOfDates &&
                                listOfDates?.map(date => (
                                    <span>[ {date.start_date} ] - [ {date.end_date} ]</span>
                                ))
                            }
                        </Card>
                    </Col>
                </Row>
            </Container>
        </Base>
    )
}