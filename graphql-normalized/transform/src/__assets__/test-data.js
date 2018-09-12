module.exports = {
  'data': {
    'chat': {
      'allConversations': {
        '__typename': 'ConversationConnection',
        'edges': [
          {
            '__typename': 'ConversationEdge',
            'cursor': 'eyJzIjpbeyJ2IjoiNDIiLCJmIjoidXBkYXRlX3NlcSIsImQiOmZhbHNlfV0sImYiOltdLCJ3IjpbXSwiaSI6W10sIm4iOltdfQ==',
            'node': {
              '__typename': 'Conversation',
              'id': '1',
              'currentConsumerChannel': null,
              'botConversationMode': 'unsupervised',
              'description': 'customer: test context generated message 9 Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam vitae tincidunt libero, fringilla tempor magna.',
              'escalationReason': null,
              'topic': null,
              'lastUpdated': null,
              'updateCount': 41,
              'sectionCount': 10,
              'lastEngagedAgentOrBot': {
                'id': '4',
                '__typename': 'Profile',
                'nickname': 'Mrs. Arvel Doyle',
                'profileType': 'agent',
                'avatarUrl': null
              },
              'lastEngagedProfile': {
                'id': '2',
                '__typename': 'Profile',
                'nickname': 'Mr. Dimitri Lebsack',
                'profileType': 'customer',
                'avatarUrl': null
              },
              'lastEngagedCustomer': {
                'id': '2',
                '__typename': 'Profile',
                'nickname': 'Mr. Dimitri Lebsack',
                'profileType': 'customer',
                'avatarUrl': null
              },
              'participants': [
                {
                  'id': '2',
                  '__typename': 'Profile',
                  'nickname': 'Mr. Dimitri Lebsack',
                  'profileType': 'customer',
                  'avatarUrl': null
                },
                {
                  'id': '4',
                  '__typename': 'Profile',
                  'nickname': 'Mrs. Arvel Doyle',
                  'profileType': 'agent',
                  'avatarUrl': null
                }
              ],
              'updates': {
                '__typename': 'UpdateConnection',
                'edges': [
                  {
                    '__typename': 'UpdateEdge',
                    'cursor': 'eyJzIjpbeyJ2IjoiMSIsImYiOiJpZCIsImQiOmZhbHNlfV0sImYiOlt7InYiOlsiMSJdLCJmIjoiY29udmVyc2F0aW9uX2lkIn1dLCJ3IjpbXSwiaSI6W10sIm4iOltdfQ==',
                    'node': {
                      '__typename': 'Update',
                      'id': '1',
                      'tentative': false,
                      'seq': 0,
                      'sectionSeq': 0,
                      'organization': null,
                      'conversation': {
                        'id': '1'
                      },
                      'createdAt': '2018-01-12T07:54:26.297Z',
                      'sender': {
                        'id': '4',
                        '__typename': 'Profile',
                        'nickname': 'Mrs. Arvel Doyle',
                        'profileType': 'agent',
                        'avatarUrl': null
                      },
                      'sentAs': {
                        'id': '4',
                        '__typename': 'Profile',
                        'nickname': 'Mrs. Arvel Doyle',
                        'profileType': 'agent',
                        'avatarUrl': null
                      },
                      'message': {
                        'text': 'test context first message'
                      }
                    }
                  },
                  {
                    '__typename': 'UpdateEdge',
                    'cursor': 'eyJzIjpbeyJ2IjoiMiIsImYiOiJpZCIsImQiOmZhbHNlfV0sImYiOlt7InYiOlsiMSJdLCJmIjoiY29udmVyc2F0aW9uX2lkIn1dLCJ3IjpbXSwiaSI6W10sIm4iOltdfQ==',
                    'node': {
                      '__typename': 'Update',
                      'id': '2',
                      'tentative': false,
                      'seq': 1,
                      'sectionSeq': 0,
                      'organization': null,
                      'conversation': {
                        'id': '1'
                      },
                      'createdAt': '2018-01-12T07:54:26.355Z',
                      'sender': {
                        'id': '4',
                        '__typename': 'Profile',
                        'nickname': 'Mrs. Arvel Doyle',
                        'profileType': 'agent',
                        'avatarUrl': null
                      },
                      'sentAs': {
                        'id': '4',
                        '__typename': 'Profile',
                        'nickname': 'Mrs. Arvel Doyle',
                        'profileType': 'agent',
                        'avatarUrl': null
                      },
                      'message': {
                        'text': 'test context generated message 0-0 Praesent dignissim tempor nunc, non egestas augue tincidunt vel.'
                      }
                    }
                  },
                  {
                    '__typename': 'UpdateEdge',
                    'cursor': 'eyJzIjpbeyJ2IjoiMyIsImYiOiJpZCIsImQiOmZhbHNlfV0sImYiOlt7InYiOlsiMSJdLCJmIjoiY29udmVyc2F0aW9uX2lkIn1dLCJ3IjpbXSwiaSI6W10sIm4iOltdfQ==',
                    'node': {
                      '__typename': 'Update',
                      'id': '3',
                      'tentative': false,
                      'seq': 2,
                      'sectionSeq': 0,
                      'organization': null,
                      'conversation': {
                        'id': '1'
                      },
                      'createdAt': '2018-01-12T07:54:26.408Z',
                      'sender': {
                        'id': '4',
                        '__typename': 'Profile',
                        'nickname': 'Mrs. Arvel Doyle',
                        'profileType': 'agent',
                        'avatarUrl': null
                      },
                      'sentAs': {
                        'id': '4',
                        '__typename': 'Profile',
                        'nickname': 'Mrs. Arvel Doyle',
                        'profileType': 'agent',
                        'avatarUrl': null
                      },
                      'message': {
                        'text': 'test context generated message 0-1 Praesent dignissim tempor nunc, non egestas augue tincidunt vel.'
                      }
                    }
                  },
                  {
                    '__typename': 'UpdateEdge',
                    'cursor': 'eyJzIjpbeyJ2IjoiNCIsImYiOiJpZCIsImQiOmZhbHNlfV0sImYiOlt7InYiOlsiMSJdLCJmIjoiY29udmVyc2F0aW9uX2lkIn1dLCJ3IjpbXSwiaSI6W10sIm4iOltdfQ==',
                    'node': {
                      '__typename': 'Update',
                      'id': '4',
                      'tentative': false,
                      'seq': 3,
                      'sectionSeq': 0,
                      'organization': null,
                      'conversation': {
                        'id': '1'
                      },
                      'createdAt': '2018-01-12T07:54:26.463Z',
                      'sender': {
                        'id': '4',
                        '__typename': 'Profile',
                        'nickname': 'Mrs. Arvel Doyle',
                        'profileType': 'agent',
                        'avatarUrl': null
                      },
                      'sentAs': {
                        'id': '4',
                        '__typename': 'Profile',
                        'nickname': 'Mrs. Arvel Doyle',
                        'profileType': 'agent',
                        'avatarUrl': null
                      },
                      'message': {
                        'text': 'test context generated message 0-2 Praesent dignissim tempor nunc, non egestas augue tincidunt vel.'
                      }
                    }
                  },
                  {
                    '__typename': 'UpdateEdge',
                    'cursor': 'eyJzIjpbeyJ2IjoiNSIsImYiOiJpZCIsImQiOmZhbHNlfV0sImYiOlt7InYiOlsiMSJdLCJmIjoiY29udmVyc2F0aW9uX2lkIn1dLCJ3IjpbXSwiaSI6W10sIm4iOltdfQ==',
                    'node': {
                      '__typename': 'Update',
                      'id': '5',
                      'tentative': false,
                      'seq': 4,
                      'sectionSeq': 0,
                      'organization': null,
                      'conversation': {
                        'id': '1'
                      },
                      'createdAt': '2018-01-12T07:54:26.519Z',
                      'sender': {
                        'id': '4',
                        '__typename': 'Profile',
                        'nickname': 'Mrs. Arvel Doyle',
                        'profileType': 'agent',
                        'avatarUrl': null
                      },
                      'sentAs': {
                        'id': '4',
                        '__typename': 'Profile',
                        'nickname': 'Mrs. Arvel Doyle',
                        'profileType': 'agent',
                        'avatarUrl': null
                      },
                      'message': {
                        'text': 'test context generated message 0-3 Praesent dignissim tempor nunc, non egestas augue tincidunt vel.'
                      }
                    }
                  },
                  {
                    '__typename': 'UpdateEdge',
                    'cursor': 'eyJzIjpbeyJ2IjoiNiIsImYiOiJpZCIsImQiOmZhbHNlfV0sImYiOlt7InYiOlsiMSJdLCJmIjoiY29udmVyc2F0aW9uX2lkIn1dLCJ3IjpbXSwiaSI6W10sIm4iOltdfQ==',
                    'node': {
                      '__typename': 'Update',
                      'id': '6',
                      'tentative': false,
                      'seq': 5,
                      'sectionSeq': 1,
                      'organization': null,
                      'conversation': {
                        'id': '1'
                      },
                      'createdAt': '2018-01-12T07:54:26.584Z',
                      'sender': {
                        'id': '2',
                        '__typename': 'Profile',
                        'nickname': 'Mr. Dimitri Lebsack',
                        'profileType': 'customer',
                        'avatarUrl': null
                      },
                      'sentAs': {
                        'id': '2',
                        '__typename': 'Profile',
                        'nickname': 'Mr. Dimitri Lebsack',
                        'profileType': 'customer',
                        'avatarUrl': null
                      },
                      'message': {
                        'text': 'test context generated message 1 Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam vitae tincidunt libero, fringilla tempor magna.'
                      }
                    }
                  },
                  {
                    '__typename': 'UpdateEdge',
                    'cursor': 'eyJzIjpbeyJ2IjoiNyIsImYiOiJpZCIsImQiOmZhbHNlfV0sImYiOlt7InYiOlsiMSJdLCJmIjoiY29udmVyc2F0aW9uX2lkIn1dLCJ3IjpbXSwiaSI6W10sIm4iOltdfQ==',
                    'node': {
                      '__typename': 'Update',
                      'id': '7',
                      'tentative': false,
                      'seq': 6,
                      'sectionSeq': 1,
                      'organization': null,
                      'conversation': {
                        'id': '1'
                      },
                      'createdAt': '2018-01-12T07:54:26.637Z',
                      'sender': {
                        'id': '2',
                        '__typename': 'Profile',
                        'nickname': 'Mr. Dimitri Lebsack',
                        'profileType': 'customer',
                        'avatarUrl': null
                      },
                      'sentAs': {
                        'id': '2',
                        '__typename': 'Profile',
                        'nickname': 'Mr. Dimitri Lebsack',
                        'profileType': 'customer',
                        'avatarUrl': null
                      },
                      'message': {
                        'text': 'test context generated message 1 Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam vitae tincidunt libero, fringilla tempor magna.'
                      }
                    }
                  },
                  {
                    '__typename': 'UpdateEdge',
                    'cursor': 'eyJzIjpbeyJ2IjoiOCIsImYiOiJpZCIsImQiOmZhbHNlfV0sImYiOlt7InYiOlsiMSJdLCJmIjoiY29udmVyc2F0aW9uX2lkIn1dLCJ3IjpbXSwiaSI6W10sIm4iOltdfQ==',
                    'node': {
                      '__typename': 'Update',
                      'id': '8',
                      'tentative': false,
                      'seq': 7,
                      'sectionSeq': 1,
                      'organization': null,
                      'conversation': {
                        'id': '1'
                      },
                      'createdAt': '2018-01-12T07:54:26.692Z',
                      'sender': {
                        'id': '2',
                        '__typename': 'Profile',
                        'nickname': 'Mr. Dimitri Lebsack',
                        'profileType': 'customer',
                        'avatarUrl': null
                      },
                      'sentAs': {
                        'id': '2',
                        '__typename': 'Profile',
                        'nickname': 'Mr. Dimitri Lebsack',
                        'profileType': 'customer',
                        'avatarUrl': null
                      },
                      'message': {
                        'text': 'test context generated message 1 Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam vitae tincidunt libero, fringilla tempor magna.'
                      }
                    }
                  },
                  {
                    '__typename': 'UpdateEdge',
                    'cursor': 'eyJzIjpbeyJ2IjoiOSIsImYiOiJpZCIsImQiOmZhbHNlfV0sImYiOlt7InYiOlsiMSJdLCJmIjoiY29udmVyc2F0aW9uX2lkIn1dLCJ3IjpbXSwiaSI6W10sIm4iOltdfQ==',
                    'node': {
                      '__typename': 'Update',
                      'id': '9',
                      'tentative': false,
                      'seq': 8,
                      'sectionSeq': 1,
                      'organization': null,
                      'conversation': {
                        'id': '1'
                      },
                      'createdAt': '2018-01-12T07:54:26.745Z',
                      'sender': {
                        'id': '2',
                        '__typename': 'Profile',
                        'nickname': 'Mr. Dimitri Lebsack',
                        'profileType': 'customer',
                        'avatarUrl': null
                      },
                      'sentAs': {
                        'id': '2',
                        '__typename': 'Profile',
                        'nickname': 'Mr. Dimitri Lebsack',
                        'profileType': 'customer',
                        'avatarUrl': null
                      },
                      'message': {
                        'text': 'test context generated message 1 Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam vitae tincidunt libero, fringilla tempor magna.'
                      }
                    }
                  },
                  {
                    '__typename': 'UpdateEdge',
                    'cursor': 'eyJzIjpbeyJ2IjoiMTAiLCJmIjoiaWQiLCJkIjpmYWxzZX1dLCJmIjpbeyJ2IjpbIjEiXSwiZiI6ImNvbnZlcnNhdGlvbl9pZCJ9XSwidyI6W10sImkiOltdLCJuIjpbXX0=',
                    'node': {
                      '__typename': 'Update',
                      'id': '10',
                      'tentative': false,
                      'seq': 9,
                      'sectionSeq': 2,
                      'organization': null,
                      'conversation': {
                        'id': '1'
                      },
                      'createdAt': '2018-01-12T07:54:26.797Z',
                      'sender': {
                        'id': '4',
                        '__typename': 'Profile',
                        'nickname': 'Mrs. Arvel Doyle',
                        'profileType': 'agent',
                        'avatarUrl': null
                      },
                      'sentAs': {
                        'id': '4',
                        '__typename': 'Profile',
                        'nickname': 'Mrs. Arvel Doyle',
                        'profileType': 'agent',
                        'avatarUrl': null
                      },
                      'message': {
                        'text': 'test context generated message 2-0 Praesent dignissim tempor nunc, non egestas augue tincidunt vel.'
                      }
                    }
                  },
                  {
                    '__typename': 'UpdateEdge',
                    'cursor': 'eyJzIjpbeyJ2IjoiMTEiLCJmIjoiaWQiLCJkIjpmYWxzZX1dLCJmIjpbeyJ2IjpbIjEiXSwiZiI6ImNvbnZlcnNhdGlvbl9pZCJ9XSwidyI6W10sImkiOltdLCJuIjpbXX0=',
                    'node': {
                      '__typename': 'Update',
                      'id': '11',
                      'tentative': false,
                      'seq': 10,
                      'sectionSeq': 2,
                      'organization': null,
                      'conversation': {
                        'id': '1'
                      },
                      'createdAt': '2018-01-12T07:54:26.846Z',
                      'sender': {
                        'id': '4',
                        '__typename': 'Profile',
                        'nickname': 'Mrs. Arvel Doyle',
                        'profileType': 'agent',
                        'avatarUrl': null
                      },
                      'sentAs': {
                        'id': '4',
                        '__typename': 'Profile',
                        'nickname': 'Mrs. Arvel Doyle',
                        'profileType': 'agent',
                        'avatarUrl': null
                      },
                      'message': {
                        'text': 'test context generated message 2-1 Praesent dignissim tempor nunc, non egestas augue tincidunt vel.'
                      }
                    }
                  },
                  {
                    '__typename': 'UpdateEdge',
                    'cursor': 'eyJzIjpbeyJ2IjoiMTIiLCJmIjoiaWQiLCJkIjpmYWxzZX1dLCJmIjpbeyJ2IjpbIjEiXSwiZiI6ImNvbnZlcnNhdGlvbl9pZCJ9XSwidyI6W10sImkiOltdLCJuIjpbXX0=',
                    'node': {
                      '__typename': 'Update',
                      'id': '12',
                      'tentative': false,
                      'seq': 11,
                      'sectionSeq': 2,
                      'organization': null,
                      'conversation': {
                        'id': '1'
                      },
                      'createdAt': '2018-01-12T07:54:26.902Z',
                      'sender': {
                        'id': '4',
                        '__typename': 'Profile',
                        'nickname': 'Mrs. Arvel Doyle',
                        'profileType': 'agent',
                        'avatarUrl': null
                      },
                      'sentAs': {
                        'id': '4',
                        '__typename': 'Profile',
                        'nickname': 'Mrs. Arvel Doyle',
                        'profileType': 'agent',
                        'avatarUrl': null
                      },
                      'message': {
                        'text': 'test context generated message 2-2 Praesent dignissim tempor nunc, non egestas augue tincidunt vel.'
                      }
                    }
                  },
                  {
                    '__typename': 'UpdateEdge',
                    'cursor': 'eyJzIjpbeyJ2IjoiMTMiLCJmIjoiaWQiLCJkIjpmYWxzZX1dLCJmIjpbeyJ2IjpbIjEiXSwiZiI6ImNvbnZlcnNhdGlvbl9pZCJ9XSwidyI6W10sImkiOltdLCJuIjpbXX0=',
                    'node': {
                      '__typename': 'Update',
                      'id': '13',
                      'tentative': false,
                      'seq': 12,
                      'sectionSeq': 2,
                      'organization': null,
                      'conversation': {
                        'id': '1'
                      },
                      'createdAt': '2018-01-12T07:54:26.949Z',
                      'sender': {
                        'id': '4',
                        '__typename': 'Profile',
                        'nickname': 'Mrs. Arvel Doyle',
                        'profileType': 'agent',
                        'avatarUrl': null
                      },
                      'sentAs': {
                        'id': '4',
                        '__typename': 'Profile',
                        'nickname': 'Mrs. Arvel Doyle',
                        'profileType': 'agent',
                        'avatarUrl': null
                      },
                      'message': {
                        'text': 'test context generated message 2-3 Praesent dignissim tempor nunc, non egestas augue tincidunt vel.'
                      }
                    }
                  },
                  {
                    '__typename': 'UpdateEdge',
                    'cursor': 'eyJzIjpbeyJ2IjoiMTQiLCJmIjoiaWQiLCJkIjpmYWxzZX1dLCJmIjpbeyJ2IjpbIjEiXSwiZiI6ImNvbnZlcnNhdGlvbl9pZCJ9XSwidyI6W10sImkiOltdLCJuIjpbXX0=',
                    'node': {
                      '__typename': 'Update',
                      'id': '14',
                      'tentative': false,
                      'seq': 13,
                      'sectionSeq': 3,
                      'organization': null,
                      'conversation': {
                        'id': '1'
                      },
                      'createdAt': '2018-01-12T07:54:26.996Z',
                      'sender': {
                        'id': '2',
                        '__typename': 'Profile',
                        'nickname': 'Mr. Dimitri Lebsack',
                        'profileType': 'customer',
                        'avatarUrl': null
                      },
                      'sentAs': {
                        'id': '2',
                        '__typename': 'Profile',
                        'nickname': 'Mr. Dimitri Lebsack',
                        'profileType': 'customer',
                        'avatarUrl': null
                      },
                      'message': {
                        'text': 'test context generated message 3 Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam vitae tincidunt libero, fringilla tempor magna.'
                      }
                    }
                  },
                  {
                    '__typename': 'UpdateEdge',
                    'cursor': 'eyJzIjpbeyJ2IjoiMTUiLCJmIjoiaWQiLCJkIjpmYWxzZX1dLCJmIjpbeyJ2IjpbIjEiXSwiZiI6ImNvbnZlcnNhdGlvbl9pZCJ9XSwidyI6W10sImkiOltdLCJuIjpbXX0=',
                    'node': {
                      '__typename': 'Update',
                      'id': '15',
                      'tentative': false,
                      'seq': 14,
                      'sectionSeq': 3,
                      'organization': null,
                      'conversation': {
                        'id': '1'
                      },
                      'createdAt': '2018-01-12T07:54:27.047Z',
                      'sender': {
                        'id': '2',
                        '__typename': 'Profile',
                        'nickname': 'Mr. Dimitri Lebsack',
                        'profileType': 'customer',
                        'avatarUrl': null
                      },
                      'sentAs': {
                        'id': '2',
                        '__typename': 'Profile',
                        'nickname': 'Mr. Dimitri Lebsack',
                        'profileType': 'customer',
                        'avatarUrl': null
                      },
                      'message': {
                        'text': 'test context generated message 3 Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam vitae tincidunt libero, fringilla tempor magna.'
                      }
                    }
                  },
                  {
                    '__typename': 'UpdateEdge',
                    'cursor': 'eyJzIjpbeyJ2IjoiMTYiLCJmIjoiaWQiLCJkIjpmYWxzZX1dLCJmIjpbeyJ2IjpbIjEiXSwiZiI6ImNvbnZlcnNhdGlvbl9pZCJ9XSwidyI6W10sImkiOltdLCJuIjpbXX0=',
                    'node': {
                      '__typename': 'Update',
                      'id': '16',
                      'tentative': false,
                      'seq': 15,
                      'sectionSeq': 3,
                      'organization': null,
                      'conversation': {
                        'id': '1'
                      },
                      'createdAt': '2018-01-12T07:54:27.101Z',
                      'sender': {
                        'id': '2',
                        '__typename': 'Profile',
                        'nickname': 'Mr. Dimitri Lebsack',
                        'profileType': 'customer',
                        'avatarUrl': null
                      },
                      'sentAs': {
                        'id': '2',
                        '__typename': 'Profile',
                        'nickname': 'Mr. Dimitri Lebsack',
                        'profileType': 'customer',
                        'avatarUrl': null
                      },
                      'message': {
                        'text': 'test context generated message 3 Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam vitae tincidunt libero, fringilla tempor magna.'
                      }
                    }
                  },
                  {
                    '__typename': 'UpdateEdge',
                    'cursor': 'eyJzIjpbeyJ2IjoiMTciLCJmIjoiaWQiLCJkIjpmYWxzZX1dLCJmIjpbeyJ2IjpbIjEiXSwiZiI6ImNvbnZlcnNhdGlvbl9pZCJ9XSwidyI6W10sImkiOltdLCJuIjpbXX0=',
                    'node': {
                      '__typename': 'Update',
                      'id': '17',
                      'tentative': false,
                      'seq': 16,
                      'sectionSeq': 3,
                      'organization': null,
                      'conversation': {
                        'id': '1'
                      },
                      'createdAt': '2018-01-12T07:54:27.167Z',
                      'sender': {
                        'id': '2',
                        '__typename': 'Profile',
                        'nickname': 'Mr. Dimitri Lebsack',
                        'profileType': 'customer',
                        'avatarUrl': null
                      },
                      'sentAs': {
                        'id': '2',
                        '__typename': 'Profile',
                        'nickname': 'Mr. Dimitri Lebsack',
                        'profileType': 'customer',
                        'avatarUrl': null
                      },
                      'message': {
                        'text': 'test context generated message 3 Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam vitae tincidunt libero, fringilla tempor magna.'
                      }
                    }
                  },
                  {
                    '__typename': 'UpdateEdge',
                    'cursor': 'eyJzIjpbeyJ2IjoiMTgiLCJmIjoiaWQiLCJkIjpmYWxzZX1dLCJmIjpbeyJ2IjpbIjEiXSwiZiI6ImNvbnZlcnNhdGlvbl9pZCJ9XSwidyI6W10sImkiOltdLCJuIjpbXX0=',
                    'node': {
                      '__typename': 'Update',
                      'id': '18',
                      'tentative': false,
                      'seq': 17,
                      'sectionSeq': 4,
                      'organization': null,
                      'conversation': {
                        'id': '1'
                      },
                      'createdAt': '2018-01-12T07:54:27.221Z',
                      'sender': {
                        'id': '4',
                        '__typename': 'Profile',
                        'nickname': 'Mrs. Arvel Doyle',
                        'profileType': 'agent',
                        'avatarUrl': null
                      },
                      'sentAs': {
                        'id': '4',
                        '__typename': 'Profile',
                        'nickname': 'Mrs. Arvel Doyle',
                        'profileType': 'agent',
                        'avatarUrl': null
                      },
                      'message': {
                        'text': 'test context generated message 4-0 Praesent dignissim tempor nunc, non egestas augue tincidunt vel.'
                      }
                    }
                  },
                  {
                    '__typename': 'UpdateEdge',
                    'cursor': 'eyJzIjpbeyJ2IjoiMTkiLCJmIjoiaWQiLCJkIjpmYWxzZX1dLCJmIjpbeyJ2IjpbIjEiXSwiZiI6ImNvbnZlcnNhdGlvbl9pZCJ9XSwidyI6W10sImkiOltdLCJuIjpbXX0=',
                    'node': {
                      '__typename': 'Update',
                      'id': '19',
                      'tentative': false,
                      'seq': 18,
                      'sectionSeq': 4,
                      'organization': null,
                      'conversation': {
                        'id': '1'
                      },
                      'createdAt': '2018-01-12T07:54:27.282Z',
                      'sender': {
                        'id': '4',
                        '__typename': 'Profile',
                        'nickname': 'Mrs. Arvel Doyle',
                        'profileType': 'agent',
                        'avatarUrl': null
                      },
                      'sentAs': {
                        'id': '4',
                        '__typename': 'Profile',
                        'nickname': 'Mrs. Arvel Doyle',
                        'profileType': 'agent',
                        'avatarUrl': null
                      },
                      'message': {
                        'text': 'test context generated message 4-1 Praesent dignissim tempor nunc, non egestas augue tincidunt vel.'
                      }
                    }
                  },
                  {
                    '__typename': 'UpdateEdge',
                    'cursor': 'eyJzIjpbeyJ2IjoiMjAiLCJmIjoiaWQiLCJkIjpmYWxzZX1dLCJmIjpbeyJ2IjpbIjEiXSwiZiI6ImNvbnZlcnNhdGlvbl9pZCJ9XSwidyI6W10sImkiOltdLCJuIjpbXX0=',
                    'node': {
                      '__typename': 'Update',
                      'id': '20',
                      'tentative': false,
                      'seq': 19,
                      'sectionSeq': 4,
                      'organization': null,
                      'conversation': {
                        'id': '1'
                      },
                      'createdAt': '2018-01-12T07:54:27.341Z',
                      'sender': {
                        'id': '4',
                        '__typename': 'Profile',
                        'nickname': 'Mrs. Arvel Doyle',
                        'profileType': 'agent',
                        'avatarUrl': null
                      },
                      'sentAs': {
                        'id': '4',
                        '__typename': 'Profile',
                        'nickname': 'Mrs. Arvel Doyle',
                        'profileType': 'agent',
                        'avatarUrl': null
                      },
                      'message': {
                        'text': 'test context generated message 4-2 Praesent dignissim tempor nunc, non egestas augue tincidunt vel.'
                      }
                    }
                  }
                ],
                'pageInfo': {
                  'hasNextPage': true,
                  'hasPrevPage': false
                }
              }
            }
          }
        ],
        'pageInfo': {
          'hasNextPage': false,
          'hasPrevPage': false
        }
      }
    }
  }
}