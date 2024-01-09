import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
`;

const Heading = styled.h1`
  margin-bottom: 20px;
  color: #e74c3c;
`;

const Text = styled.p`
  font-size: 1.2em;
  margin-bottom: 20px;
`;

const StyledLink = styled(Link)`
  font-size: 1.2em;
  color: #3498db; // Blue color
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const NotFoundPage: React.FC = () => {
    return (
        <Container>
            <Heading className="text-[3em] md:text-[4em]">404 - Not Found</Heading>
            <Text>The page you are looking for might be under construction or does not exist.</Text>
            <StyledLink to="/">Go to Home</StyledLink>
        </Container>
    );
};

export default NotFoundPage;