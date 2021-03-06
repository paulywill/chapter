import React, { useMemo } from 'react';
import { NextPage } from 'next';
import { useEventQuery, useRsvpToEventMutation } from 'generated/graphql';
import { useParam } from 'hooks/useParam';

import {
  Heading,
  VStack,
  Text,
  Button,
  useToast,
  List,
  ListItem,
  Avatar,
} from '@chakra-ui/react';
import { Link } from 'chakra-next-link';
import { useAuth } from '../../auth/store';
import { EVENT } from '../../dashboard/Events/graphql/queries';
import { useConfirm } from 'chakra-confirm';
import { HStack } from '@chakra-ui/layout';

export const EventPage: NextPage = () => {
  const id = useParam('eventId');
  const { user } = useAuth();

  const [rsvpToEvent] = useRsvpToEventMutation();
  const { loading, error, data } = useEventQuery({
    variables: { id: id || -1 },
  });

  const toast = useToast();
  const confirm = useConfirm();

  const userRsvped = useMemo(
    () => data?.event?.rsvps.some((rsvp) => rsvp.user.id === user?.id),
    [data?.event],
  );

  if (loading) {
    return <h1>Loading...</h1>;
  }

  if (error || !data?.event) {
    return (
      <div>
        <h1>error...</h1>
        <h2>{error?.message}</h2>
      </div>
    );
  }

  const onRsvp = async (add: boolean) => {
    const ok = await confirm(
      add
        ? { title: 'You want to join this?' }
        : { title: 'Are you sure you want to cancel your RSVP' },
    );

    if (ok) {
      try {
        await rsvpToEvent({
          variables: { eventId: id },
          refetchQueries: [{ query: EVENT, variables: { id } }],
        });

        toast(
          add
            ? {
                title: 'You successfully RSVPed to this event',
                status: 'success',
              }
            : { title: 'You canceled your RSVP 👋', status: 'error' },
        );
      } catch (err) {
        toast({ title: 'Something went wrong', status: 'error' });
        console.error(err);
      }
    }
  };

  return (
    <VStack align="flex-start">
      <Heading>{data.event.name}</Heading>
      <Heading size="md">
        Chapter:{' '}
        <Link href={`/chapters/${data.event.chapter.id}`}>
          {data.event.chapter.name}
        </Link>
      </Heading>
      <Text>{data.event.description}</Text>

      <Heading>RSVPs:</Heading>
      {userRsvped ? (
        <HStack>
          <Heading>You&lsquo;ve RSVPed to this event</Heading>
          <Button colorScheme="red" onClick={() => onRsvp(false)}>
            Cancel
          </Button>
        </HStack>
      ) : (
        <Button colorScheme="blue" onClick={() => onRsvp(true)}>
          RSVP
        </Button>
      )}

      <List>
        {data.event.rsvps.map((rsvp) => (
          <ListItem key={rsvp.id}>
            <HStack>
              <Avatar name={rsvp.user.name} />
              <Heading size="md">{rsvp.user.name}</Heading>
            </HStack>
          </ListItem>
        ))}
      </List>
    </VStack>
  );
};
