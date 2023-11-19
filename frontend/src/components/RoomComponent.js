// RoomComponent.js
import React from 'react';
import styled from 'styled-components';
import {Col, Container, Row} from "reactstrap";
import Button from "@mui/material/Button";
import {useNavigate} from "react-router-dom";

const RoomWrapper = styled.div`
  //max-width: 400px;
  margin-right: 20px;
  margin-left: 20px;
  margin-top: 20px;
  //border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  //box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const RoomImage = styled.img`
  width: 100%;
  //height: 200px;
  object-fit: cover;
`;

const RoomDetails = styled.div`
  padding: 16px;
  text-align: left;
`;

const Title = styled.h2`
  margin-bottom: 8px;
  color: #333;
`;

const Description = styled.p`
  color: #666;
`;

const Price = styled.div`
  margin-top: 16px;
  font-size: 1.2em;
  color: #3498db;
`;

const ButtonS = styled.div`
  background-color: #504099; /* Green */
  border: none;
  border-radius: 8px;
  color: white;
  padding: 12px 32px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  //margin: 4px 2px;
  cursor: pointer;

  &:hover {
    background-color: #313866; /* Darker green on hover */
  }
`;

export const RoomComponent = ({id, imageSrc, description}) => {
    const navigate = useNavigate();
    return (
        <RoomWrapper>
            <Row>
                <Col xl={6} lg={6} md={6} sm={12} xs={12}>
                    <RoomImage src={imageSrc} alt="Image here"/>
                </Col>
                <Col xl={6} lg={6} md={6} sm={12} xs={12}>
                    <RoomDetails>
                        <Description>{description}</Description>
                        <Button variant="outlined" onClick={() => {
                            navigate("/room-detail/" + id);
                        }}>Read More</Button>
                        {/*<Link to={'/' + id} className="btn btn-dark"></Link>*/}
                    </RoomDetails>
                </Col>
            </Row>
        </RoomWrapper>
    )
}
